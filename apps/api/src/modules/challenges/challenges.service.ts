import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Challenge } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateDuelDto, DuelMetric, RespondDuelDto } from './dto/challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) {}

  // --- Гильдии ----------------------------------------------------------------

  async listGuilds() {
    const guilds = await this.prisma.guild.findMany({
      include: {
        members: {
          include: { student: { select: { id: true, fullName: true, avatarUrl: true, progress: { select: { skillScore: true } } } } },
        },
      },
    });
    return guilds
      .map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        emblem: g.emblem,
        memberCount: g.members.length,
        totalScore: g.members.reduce((sum, m) => sum + (m.student.progress?.skillScore ?? 0), 0),
        members: g.members
          .map((m) => ({
            id: m.student.id,
            fullName: m.student.fullName,
            avatarUrl: m.student.avatarUrl,
            skillScore: m.student.progress?.skillScore ?? 0,
          }))
          .sort((a, b) => b.skillScore - a.skillScore)
          .slice(0, 8),
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  async getMyGuild(userId: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const membership = await this.prisma.guildMembership.findUnique({
      where: { studentId },
      select: { guildId: true },
    });
    return membership ? { guildId: membership.guildId } : { guildId: null };
  }

  async joinGuild(userId: string, guildId: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) throw new NotFoundException('Гильдия не найдена');
    await this.prisma.guildMembership.upsert({
      where: { studentId },
      create: { guildId, studentId },
      update: { guildId },
    });
    return { success: true, guildId };
  }

  async leaveGuild(userId: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    await this.prisma.guildMembership.deleteMany({ where: { studentId } });
    return { success: true };
  }

  // --- Дуэли ------------------------------------------------------------------

  async createDuel(userId: string, dto: CreateDuelDto) {
    const studentId = await this.gamification.resolveStudentId(userId);
    if (dto.opponentId === studentId) throw new BadRequestException('Нельзя вызвать себя');
    const opponent = await this.prisma.studentProfile.findUnique({ where: { id: dto.opponentId } });
    if (!opponent) throw new NotFoundException('Соперник не найден');

    return this.prisma.challenge.create({
      data: {
        type: 'DUEL',
        title: `Дуэль: ${this.metricLabel(dto.metric)} (цель ${dto.target})`,
        metric: dto.metric,
        target: dto.target,
        challengerId: studentId,
        opponentId: dto.opponentId,
        status: 'PENDING',
        endsAt: new Date(Date.now() + dto.days * 24 * 60 * 60 * 1000),
      },
    });
  }

  async respondDuel(userId: string, id: string, dto: RespondDuelDto) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException('Челлендж не найден');
    if (challenge.opponentId !== studentId) throw new ForbiddenException('Это не ваш вызов');
    if (challenge.status !== 'PENDING') throw new BadRequestException('Вызов уже обработан');

    return this.prisma.challenge.update({
      where: { id },
      data: { status: dto.accept ? 'ACTIVE' : 'DECLINED', startsAt: new Date() },
    });
  }

  async listMine(userId: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const challenges = await this.prisma.challenge.findMany({
      where: { OR: [{ challengerId: studentId }, { opponentId: studentId }] },
      orderBy: { createdAt: 'desc' },
    });

    const ids = new Set<string>();
    challenges.forEach((c) => {
      ids.add(c.challengerId);
      if (c.opponentId) ids.add(c.opponentId);
    });
    const profiles = await this.prisma.studentProfile.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true, fullName: true, avatarUrl: true },
    });
    const byId = new Map(profiles.map((p) => [p.id, p]));

    const enriched = [];
    for (const c of challenges) {
      const finalized = await this.finalizeIfDue(c);
      const [challengerProgress, opponentProgress] = await Promise.all([
        this.computeMetric(finalized.challengerId, finalized.metric as DuelMetric, finalized.startsAt),
        finalized.opponentId
          ? this.computeMetric(finalized.opponentId, finalized.metric as DuelMetric, finalized.startsAt)
          : Promise.resolve(0),
      ]);
      enriched.push({
        ...finalized,
        metricLabel: this.metricLabel(finalized.metric as DuelMetric),
        challenger: byId.get(finalized.challengerId) ?? null,
        opponent: finalized.opponentId ? (byId.get(finalized.opponentId) ?? null) : null,
        challengerProgress,
        opponentProgress,
        isChallenger: finalized.challengerId === studentId,
      });
    }
    return enriched;
  }

  // --- Вспомогательное --------------------------------------------------------

  private async finalizeIfDue(challenge: Challenge): Promise<Challenge> {
    if (challenge.status === 'ACTIVE' && challenge.endsAt <= new Date()) {
      const [a, b] = await Promise.all([
        this.computeMetric(challenge.challengerId, challenge.metric as DuelMetric, challenge.startsAt),
        challenge.opponentId
          ? this.computeMetric(challenge.opponentId, challenge.metric as DuelMetric, challenge.startsAt)
          : Promise.resolve(0),
      ]);
      const winnerId = a === b ? null : a > b ? challenge.challengerId : challenge.opponentId;
      return this.prisma.challenge.update({
        where: { id: challenge.id },
        data: { status: 'COMPLETED', winnerId, challengerProgress: a, opponentProgress: b },
      });
    }
    return challenge;
  }

  private async computeMetric(studentId: string, metric: DuelMetric, since: Date): Promise<number> {
    if (metric === 'problems') {
      return this.prisma.activityProof.count({
        where: { studentId, type: 'PROBLEM_SOLVED', occurredAt: { gte: since } },
      });
    }
    if (metric === 'active_days') {
      return this.prisma.dailyActivity.count({
        where: { studentId, date: { gte: since }, count: { gt: 0 } },
      });
    }
    // commits
    const proofs = await this.prisma.activityProof.findMany({
      where: { studentId, type: 'COMMIT', occurredAt: { gte: since } },
      select: { weight: true },
    });
    return proofs.reduce((sum, p) => sum + Math.round(p.weight / 0.4), 0);
  }

  private metricLabel(metric: DuelMetric): string {
    return { commits: 'Коммиты', problems: 'Решённые задачи', active_days: 'Активные дни' }[metric];
  }
}
