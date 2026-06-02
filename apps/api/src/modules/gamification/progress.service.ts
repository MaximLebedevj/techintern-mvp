import { Injectable } from '@nestjs/common';
import type { League } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { computeSkillScore } from './skill-score';
import { computeStreaks, toDayKey } from './streak';
import { leagueForScore } from './league';
import { evaluateBadges } from './badges';

interface GithubStats {
  stars?: number;
  followers?: number;
  commits?: number;
  languages?: string[];
}
interface CodewarsStats {
  honor?: number;
  solved?: number;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Пересчитывает денормализованный прогресс студента (streak, Skill Score, лига)
 * и выдаёт заслуженные бейджи. Вызывается после синка интеграций и check-in привычек.
 */
@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async recompute(studentId: string) {
    await this.rebuildDailyActivity(studentId);
    const since = new Date(Date.now() - NINETY_DAYS_MS);

    const [daily, proofs, integrations, offers, guides] = await Promise.all([
      this.prisma.dailyActivity.findMany({
        where: { studentId, count: { gt: 0 } },
        select: { date: true },
      }),
      this.prisma.activityProof.findMany({
        where: { studentId },
        select: { weight: true, occurredAt: true },
      }),
      this.prisma.integration.findMany({ where: { studentId } }),
      this.prisma.application.count({ where: { studentId, status: 'OFFER' } }),
      this.prisma.guideProgress.count({ where: { studentId, completed: true } }),
    ]);

    const streaks = computeStreaks(daily.map((d) => toDayKey(d.date)));
    const weightedProofs90 = proofs
      .filter((p) => p.occurredAt >= since)
      .reduce((sum, p) => sum + p.weight, 0);

    const github = this.readStats<GithubStats>(integrations, 'GITHUB');
    const codewars = this.readStats<CodewarsStats>(integrations, 'CODEWARS');

    const { score, breakdown, consistency30 } = computeSkillScore({
      currentStreak: streaks.currentStreak,
      activeDaysLast30: streaks.activeDaysLast30,
      weightedProofs90,
      social: {
        stars: github?.stars ?? 0,
        followers: github?.followers ?? 0,
        codewarsHonor: codewars?.honor ?? 0,
        offers,
      },
    });

    const league = leagueForScore(score);

    const progress = await this.prisma.studentProgress.upsert({
      where: { studentId },
      create: {
        studentId,
        skillScore: score,
        league,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        lastActiveDate: streaks.lastActiveDate ? new Date(streaks.lastActiveDate) : null,
        consistency30,
        totalProofs: proofs.length,
        scoreBreakdown: breakdown,
      },
      update: {
        skillScore: score,
        league,
        currentStreak: streaks.currentStreak,
        longestStreak: Math.max(streaks.longestStreak, 0),
        lastActiveDate: streaks.lastActiveDate ? new Date(streaks.lastActiveDate) : null,
        consistency30,
        totalProofs: proofs.length,
        scoreBreakdown: breakdown,
      },
    });

    await this.awardBadges(studentId, {
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      githubCommits: github?.commits ?? 0,
      languages: github?.languages?.length ?? 0,
      codewarsSolved: codewars?.solved ?? 0,
      guidesCompleted: guides,
      offers,
      league,
    });

    return { ...progress, withering: streaks.withering, daysSinceActive: streaks.daysSinceActive };
  }

  private readStats<T>(
    integrations: { provider: string; stats: unknown }[],
    provider: string,
  ): T | null {
    const found = integrations.find((i) => i.provider === provider);
    return (found?.stats as T) ?? null;
  }

  /** Создаёт StudentBadge для впервые заслуженных бейджей. */
  private async awardBadges(
    studentId: string,
    ctx: Parameters<typeof evaluateBadges>[0],
  ): Promise<void> {
    const earnedKeys = evaluateBadges(ctx);
    if (earnedKeys.length === 0) return;

    const [badges, existing] = await Promise.all([
      this.prisma.badge.findMany({ where: { key: { in: earnedKeys } }, select: { id: true, key: true } }),
      this.prisma.studentBadge.findMany({ where: { studentId }, select: { badgeId: true } }),
    ]);

    const existingIds = new Set(existing.map((e) => e.badgeId));
    const toCreate = badges
      .filter((b) => !existingIds.has(b.id))
      .map((b) => ({ studentId, badgeId: b.id }));

    if (toCreate.length > 0) {
      await this.prisma.studentBadge.createMany({ data: toCreate, skipDuplicates: true });
    }
  }

  /**
   * Перестраивает DailyActivity из доказательств и отметок привычек —
   * единый источник правды, защищённый от двойного учёта при ре-синке.
   */
  async rebuildDailyActivity(studentId: string): Promise<void> {
    const [proofs, checkins] = await Promise.all([
      this.prisma.activityProof.findMany({
        where: { studentId },
        select: { occurredAt: true, source: true },
      }),
      this.prisma.habitCheckin.findMany({
        where: { habit: { studentId } },
        select: { date: true, count: true },
      }),
    ]);

    const byDay = new Map<string, { count: number; sources: Set<string> }>();
    const add = (date: Date, count: number, source: string) => {
      const key = toDayKey(date);
      const entry = byDay.get(key) ?? { count: 0, sources: new Set<string>() };
      entry.count += count;
      entry.sources.add(source);
      byDay.set(key, entry);
    };

    for (const proof of proofs) add(proof.occurredAt, 1, proof.source);
    for (const checkin of checkins) add(checkin.date, checkin.count, 'HABIT');

    await this.prisma.$transaction([
      this.prisma.dailyActivity.deleteMany({ where: { studentId } }),
      this.prisma.dailyActivity.createMany({
        data: [...byDay.entries()].map(([date, value]) => ({
          studentId,
          date: new Date(date),
          count: value.count,
          sources: [...value.sources],
        })),
      }),
    ]);
  }
}
