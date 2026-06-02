import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, Prisma, VacancyStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { PassportService } from '../passport/passport.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

/** Подписи событий статус-трекера по умолчанию. */
const STATUS_NOTES: Record<ApplicationStatus, string> = {
  PENDING: 'Отклик отправлен',
  INVITED: 'Вас пригласили на собеседование',
  OFFER: 'Поздравляем! Компания готова сделать оффер',
  REJECTED: 'К сожалению, на этот раз не сложилось',
};

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matching: MatchingService,
    private readonly passport: PassportService,
  ) {}

  private readonly studentInclude = {
    vacancy: {
      include: {
        company: { select: { id: true, name: true, logoUrl: true, city: true, userId: true } },
        skills: { include: { skill: true } },
      },
    },
    events: { orderBy: { createdAt: 'asc' } },
  } satisfies Prisma.ApplicationInclude;

  // --- Студент откликается ----------------------------------------------------

  async apply(userId: string, dto: CreateApplicationDto) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!student) throw new ForbiddenException('Профиль студента не найден');

    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: dto.vacancyId } });
    if (!vacancy || vacancy.status !== VacancyStatus.ACTIVE) {
      throw new NotFoundException('Вакансия недоступна');
    }

    const existing = await this.prisma.application.findUnique({
      where: { studentId_vacancyId: { studentId: student.id, vacancyId: dto.vacancyId } },
    });
    if (existing) throw new ConflictException('Вы уже откликнулись на эту вакансию');

    // Снимок match-score на момент отклика.
    const match = await this.matching.match(student.id, dto.vacancyId);

    // Опционально прикрепляем снимок Skill Proof Passport.
    const passportSnapshot = dto.attachPassport
      ? ((await this.passport.buildSnapshot(student.id)) as Prisma.InputJsonValue)
      : undefined;

    return this.prisma.application.create({
      data: {
        studentId: student.id,
        vacancyId: dto.vacancyId,
        coverLetter: dto.coverLetter,
        matchScore: match.score,
        passportSnapshot,
        status: ApplicationStatus.PENDING,
        events: { create: { status: ApplicationStatus.PENDING, note: STATUS_NOTES.PENDING } },
      },
      include: this.studentInclude,
    });
  }

  // --- Списки и деталь --------------------------------------------------------

  async listMine(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!student) throw new ForbiddenException('Профиль студента не найден');

    return this.prisma.application.findMany({
      where: { studentId: student.id },
      include: this.studentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(userId: string, id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        ...this.studentInclude,
        student: { select: { id: true, userId: true, fullName: true, avatarUrl: true } },
      },
    });
    if (!application) throw new NotFoundException('Отклик не найден');

    const isOwnerStudent = application.student.userId === userId;
    const isOwnerCompany = application.vacancy.company.userId === userId;
    if (!isOwnerStudent && !isOwnerCompany) {
      throw new ForbiddenException('Нет доступа к этому отклику');
    }
    return application;
  }

  /** Студент отзывает свой отклик. */
  async withdraw(userId: string, id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { student: { select: { userId: true } } },
    });
    if (!application) throw new NotFoundException('Отклик не найден');
    if (application.student.userId !== userId) {
      throw new ForbiddenException('Это не ваш отклик');
    }
    await this.prisma.application.delete({ where: { id } });
    return { success: true };
  }

  // --- Компания меняет статус -------------------------------------------------

  async updateStatus(userId: string, id: string, dto: UpdateApplicationStatusDto) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        vacancy: { include: { company: { select: { id: true, userId: true } } } },
        student: { select: { id: true } },
      },
    });
    if (!application) throw new NotFoundException('Отклик не найден');
    if (application.vacancy.company.userId !== userId) {
      throw new ForbiddenException('Это не ваш отклик');
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        status: dto.status,
        events: { create: { status: dto.status, note: dto.note ?? STATUS_NOTES[dto.status] } },
      },
      include: this.studentInclude,
    });

    // При приглашении/оффере открываем диалог рекрутёр ↔ студент.
    if (dto.status === ApplicationStatus.INVITED || dto.status === ApplicationStatus.OFFER) {
      await this.ensureConversation(
        application.student.id,
        application.vacancy.company.id,
        application.vacancy.company.userId,
        dto.status,
      );
    }

    return updated;
  }

  private async ensureConversation(
    studentId: string,
    companyId: string,
    companyUserId: string,
    status: ApplicationStatus,
  ): Promise<void> {
    const conversation = await this.prisma.conversation.upsert({
      where: { studentId_companyId: { studentId, companyId } },
      create: { studentId, companyId },
      update: {},
    });

    const greeting =
      status === ApplicationStatus.OFFER
        ? 'Рады сообщить: мы готовы сделать вам оффер! Давайте обсудим детали.'
        : 'Здравствуйте! Нам понравился ваш профиль — приглашаем на собеседование. Когда вам удобно?';

    await this.prisma.message.create({
      data: { conversationId: conversation.id, senderUserId: companyUserId, body: greeting },
    });
  }
}
