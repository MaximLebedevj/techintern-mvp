import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { IssuedTokens, TokenService } from './token.service';
import { RegisterDto, RegisterRole } from './dto/register.dto';
import type { OAuthProfile, SessionUser } from './auth.types';

const BCRYPT_ROUNDS = 12;

/**
 * Прикладной сервис аутентификации: регистрация (студент/компания), вход,
 * обновление и завершение сессии, вход через OAuth (см. CLAUDE.md §4).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  // --- Email + пароль ---------------------------------------------------------

  async register(dto: RegisterDto): Promise<{ user: SessionUser } & IssuedTokens> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже зарегистрирован');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const role = dto.role === RegisterRole.COMPANY ? Role.COMPANY : Role.STUDENT;

    // Создаём пользователя и связанный профиль атомарно.
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        provider: AuthProvider.LOCAL,
        ...(role === Role.STUDENT
          ? { studentProfile: { create: { fullName: dto.name } } }
          : { companyProfile: { create: { name: dto.name } } }),
      },
      include: { studentProfile: true, companyProfile: true },
    });

    const issued = await this.tokens.issueTokens(user);
    return { user: this.toSessionUser(user), ...issued };
  }

  async validateUser(email: string, password: string): Promise<SessionUserRecord> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { studentProfile: true, companyProfile: true },
    });
    if (!user || !user.passwordHash) {
      // Пользователь только с OAuth не может войти по паролю.
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Неверный email или пароль');
    if (!user.isActive) throw new UnauthorizedException('Аккаунт деактивирован');
    return user;
  }

  async login(user: SessionUserRecord): Promise<{ user: SessionUser } & IssuedTokens> {
    const issued = await this.tokens.issueTokens(user);
    return { user: this.toSessionUser(user), ...issued };
  }

  // --- Refresh / logout -------------------------------------------------------

  async refresh(refreshToken: string): Promise<IssuedTokens> {
    const payload = await this.tokens.verifyRefresh(refreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('Сессия недействительна');
    return this.tokens.rotate(refreshToken, user);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.tokens.revoke(refreshToken);
  }

  // --- OAuth ------------------------------------------------------------------

  async oauthLogin(profile: OAuthProfile): Promise<{ user: SessionUser } & IssuedTokens> {
    const provider = profile.provider as AuthProvider;
    const email = profile.email.toLowerCase().trim();

    // 1) ищем по провайдеру; 2) связываем по email; 3) создаём нового студента.
    let user = await this.prisma.user.findFirst({
      where: { provider, providerId: profile.providerId },
      include: { studentProfile: true, companyProfile: true },
    });

    if (!user) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email },
        include: { studentProfile: true, companyProfile: true },
      });

      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: { provider, providerId: profile.providerId },
          include: { studentProfile: true, companyProfile: true },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email,
            provider,
            providerId: profile.providerId,
            role: Role.STUDENT,
            studentProfile: {
              create: { fullName: profile.name, avatarUrl: profile.avatarUrl },
            },
          },
          include: { studentProfile: true, companyProfile: true },
        });
      }
    }

    const issued = await this.tokens.issueTokens(user);
    return { user: this.toSessionUser(user), ...issued };
  }

  // --- Чтение текущего пользователя ------------------------------------------

  async getSession(userId: string): Promise<SessionUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true, companyProfile: true },
    });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    return this.toSessionUser(user);
  }

  // --- Маппинг ----------------------------------------------------------------

  private toSessionUser(user: SessionUserRecord): SessionUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      student: user.studentProfile
        ? {
            id: user.studentProfile.id,
            fullName: user.studentProfile.fullName,
            avatarUrl: user.studentProfile.avatarUrl,
            headline: user.studentProfile.headline,
            isPremium: user.studentProfile.isPremium,
          }
        : null,
      company: user.companyProfile
        ? {
            id: user.companyProfile.id,
            name: user.companyProfile.name,
            logoUrl: user.companyProfile.logoUrl,
            plan: user.companyProfile.plan,
          }
        : null,
    };
  }
}

/** Пользователь с подгруженными профилями (внутренний тип сервиса). */
type SessionUserRecord = Prisma.UserGetPayload<{
  include: { studentProfile: true; companyProfile: true };
}>;
