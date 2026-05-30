import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import type { AppConfig } from '../../config/configuration';
import { RedisService } from '../../infra/redis/redis.service';
import type { JwtPayload, RefreshPayload } from '../../common/types/auth.types';
import type { Role } from '@prisma/client';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserLike {
  id: string;
  email: string;
  role: Role;
}

/**
 * Выпуск/ротация/отзыв токенов.
 * Access (15m) — stateless JWT. Refresh (7d) — JWT, чей SHA-256 хранится в Redis
 * под ключом сессии (sid), что даёт ротацию и отзыв (см. CLAUDE.md §4).
 */
@Injectable()
export class TokenService {
  private readonly cfg: AppConfig['jwt'];

  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    config: ConfigService<{ config: AppConfig }>,
  ) {
    this.cfg = config.get('config.jwt', { infer: true }) as AppConfig['jwt'];
  }

  private redisKey(userId: string, sid: string): string {
    return `refresh:${userId}:${sid}`;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Конвертирует '15m'/'7d'/'3600s' в секунды для TTL Redis. */
  private toSeconds(duration: string): number {
    const match = /^(\d+)([smhd])$/.exec(duration.trim());
    if (!match) return Number(duration) || 0;
    const value = Number(match[1]);
    const unit = match[2] ?? 's';
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] ?? 1);
  }

  async issueTokens(user: UserLike): Promise<IssuedTokens> {
    const sid = randomUUID();
    const accessPayload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const refreshPayload: RefreshPayload = { sub: user.id, sid };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.cfg.accessSecret,
        expiresIn: this.cfg.accessTtl,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.cfg.refreshSecret,
        expiresIn: this.cfg.refreshTtl,
      }),
    ]);

    await this.redis.set(
      this.redisKey(user.id, sid),
      this.hash(refreshToken),
      this.toSeconds(this.cfg.refreshTtl),
    );

    return { accessToken, refreshToken };
  }

  /**
   * Проверяет refresh-токен и выпускает новую пару, ротируя сессию.
   * Старый sid удаляется — повторное использование станет невозможным.
   */
  async rotate(refreshToken: string, user: UserLike): Promise<IssuedTokens> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.cfg.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Сессия истекла, войдите заново');
    }

    const key = this.redisKey(payload.sub, payload.sid);
    const stored = await this.redis.get(key);
    if (!stored || stored !== this.hash(refreshToken)) {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    await this.redis.del(key); // ротация: гасим старую сессию
    return this.issueTokens(user);
  }

  /** Декодирует refresh-токен, не доверяя данным (только для извлечения sub). */
  async verifyRefresh(refreshToken: string): Promise<RefreshPayload> {
    try {
      return await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.cfg.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Сессия истекла, войдите заново');
    }
  }

  async revoke(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.cfg.refreshSecret,
      });
      await this.redis.del(this.redisKey(payload.sub, payload.sid));
    } catch {
      /* токен уже невалиден — отзывать нечего */
    }
  }
}
