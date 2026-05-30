import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/auth.types';
import { SendMessageDto, StartConversationDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly participantsInclude = {
    student: { select: { id: true, userId: true, fullName: true, avatarUrl: true, headline: true } },
    company: { select: { id: true, userId: true, name: true, logoUrl: true } },
  } satisfies Prisma.ConversationInclude;

  /** Проверяет, что пользователь — участник диалога; возвращает диалог. */
  private async requireParticipant(user: AuthenticatedUser, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: this.participantsInclude,
    });
    if (!conversation) throw new NotFoundException('Диалог не найден');
    const isParticipant =
      conversation.student.userId === user.id || conversation.company.userId === user.id;
    if (!isParticipant) throw new ForbiddenException('Нет доступа к диалогу');
    return conversation;
  }

  async listMine(user: AuthenticatedUser) {
    const where: Prisma.ConversationWhereInput =
      user.role === Role.COMPANY
        ? { company: { userId: user.id } }
        : { student: { userId: user.id } };

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: {
        ...this.participantsInclude,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((c) => ({
      id: c.id,
      student: c.student,
      company: c.company,
      lastMessage: c.messages[0] ?? null,
      updatedAt: c.updatedAt,
    }));
  }

  async getMessages(user: AuthenticatedUser, conversationId: string) {
    await this.requireParticipant(user, conversationId);

    // Помечаем входящие сообщения прочитанными.
    await this.prisma.message.updateMany({
      where: { conversationId, senderUserId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    });

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(user: AuthenticatedUser, conversationId: string, dto: SendMessageDto) {
    await this.requireParticipant(user, conversationId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderUserId: user.id, body: dto.body },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  }

  /** Старт диалога (или возврат существующего). */
  async start(user: AuthenticatedUser, dto: StartConversationDto) {
    let studentId: string;
    let companyId: string;

    if (user.role === Role.STUDENT) {
      if (!dto.companyId) throw new BadRequestException('Не указана компания');
      const student = await this.prisma.studentProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!student) throw new ForbiddenException('Профиль студента не найден');
      studentId = student.id;
      companyId = dto.companyId;
    } else {
      if (!dto.studentId) throw new BadRequestException('Не указан студент');
      const company = await this.prisma.companyProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!company) throw new ForbiddenException('Профиль компании не найден');
      companyId = company.id;
      studentId = dto.studentId;
    }

    return this.prisma.conversation.upsert({
      where: { studentId_companyId: { studentId, companyId } },
      create: { studentId, companyId },
      update: {},
      include: this.participantsInclude,
    });
  }
}
