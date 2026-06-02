import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { LEAGUE_LABELS, leagueForScore, nextLeague } from '../gamification/league';
import { STREAK_GRACE_DAYS, toDayKey } from '../gamification/streak';

interface GithubStats {
  commits?: number;
  stars?: number;
  repos?: number;
  followers?: number;
  languages?: string[];
}
interface CodewarsStats {
  solved?: number;
  honor?: number;
  rank?: string;
  languages?: string[];
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

const displayTech = (name: string): string => {
  const map: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    go: 'Go',
    rust: 'Rust',
    'c++': 'C++',
    'c#': 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    html: 'HTML',
    css: 'CSS',
    shell: 'Shell',
    kotlin: 'Kotlin',
    swift: 'Swift',
  };
  return map[name.toLowerCase()] ?? name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * Сборщик Skill Proof Passport — живого верифицированного «паспорта навыков».
 */
@Injectable()
export class PassportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) {}

  async getMyPassport(userId: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    return this.build(studentId);
  }

  async getPublicPassport(studentId: string) {
    return this.build(studentId);
  }

  async build(studentId: string) {
    const since = new Date(Date.now() - NINETY_DAYS_MS);

    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        headline: true,
        specialization: true,
        level: true,
        progress: true,
        integrations: true,
        badges: { include: { badge: true }, orderBy: { awardedAt: 'desc' } },
        skills: { include: { skill: true }, orderBy: { progress: 'desc' }, take: 8 },
        _count: { select: { projects: true } },
      },
    });
    if (!student) throw new NotFoundException('Студент не найден');

    const [recentProofs, activeDays90, market] = await Promise.all([
      this.prisma.activityProof.findMany({
        where: { studentId },
        orderBy: { occurredAt: 'desc' },
        take: 12,
        select: { source: true, type: true, title: true, url: true, occurredAt: true, weight: true },
      }),
      this.prisma.dailyActivity.count({ where: { studentId, date: { gte: since }, count: { gt: 0 } } }),
      this.gamification.getMarketComparison(studentId),
    ]);

    const progress = student.progress;
    const score = progress?.skillScore ?? 0;
    const league = progress?.league ?? leagueForScore(score);

    const github = this.statsOf<GithubStats>(student.integrations, 'GITHUB');
    const codewars = this.statsOf<CodewarsStats>(student.integrations, 'CODEWARS');

    // Доказанные технологии: верифицированные (из интеграций) + заявленные (навыки).
    const verified = new Map<string, true>();
    [...(github?.languages ?? []), ...(codewars?.languages ?? [])].forEach((l) =>
      verified.set(displayTech(l), true),
    );
    const provenTech = [
      ...[...verified.keys()].map((name) => ({ name, verified: true })),
      ...student.skills
        .filter((s) => !verified.has(s.skill.name) && s.progress >= 40)
        .map((s) => ({ name: s.skill.name, verified: false })),
    ].slice(0, 14);

    const daysSinceActive = progress?.lastActiveDate
      ? Math.floor((Date.now() - progress.lastActiveDate.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        avatarUrl: student.avatarUrl,
        headline: student.headline,
        specialization: student.specialization,
        level: student.level,
      },
      skillScore: score,
      league,
      leagueLabel: LEAGUE_LABELS[league],
      nextLeague: nextLeague(score),
      scoreBreakdown: (progress?.scoreBreakdown as Record<string, number>) ?? {
        streak: 0,
        volume: 0,
        social: 0,
      },
      streak: {
        current: progress?.currentStreak ?? 0,
        longest: progress?.longestStreak ?? 0,
        consistency30: progress?.consistency30 ?? 0,
        daysSinceActive,
        withering: daysSinceActive !== null && daysSinceActive > STREAK_GRACE_DAYS,
      },
      market,
      provenTech,
      integrations: student.integrations.map((i) => ({
        provider: i.provider,
        username: i.username,
        status: i.status,
        stats: i.stats,
        lastSyncedAt: i.lastSyncedAt,
      })),
      badges: student.badges.map((b) => ({
        key: b.badge.key,
        title: b.badge.title,
        description: b.badge.description,
        icon: b.badge.icon,
        category: b.badge.category,
        tier: b.badge.tier,
        awardedAt: b.awardedAt,
      })),
      recentActivity: recentProofs,
      stats: {
        githubCommits: github?.commits ?? 0,
        githubStars: github?.stars ?? 0,
        githubRepos: github?.repos ?? 0,
        codewarsSolved: codewars?.solved ?? 0,
        totalProofs: progress?.totalProofs ?? 0,
        projects: student._count.projects,
        activeDays90,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /** Компактный снимок для прикрепления к отклику. */
  async buildSnapshot(studentId: string) {
    const passport = await this.build(studentId);
    return {
      skillScore: passport.skillScore,
      league: passport.league,
      leagueLabel: passport.leagueLabel,
      currentStreak: passport.streak.current,
      longestStreak: passport.streak.longest,
      consistency30: passport.streak.consistency30,
      topPercent: passport.market?.topPercent ?? null,
      badgeCount: passport.badges.length,
      provenTech: passport.provenTech.filter((t) => t.verified).map((t) => t.name).slice(0, 8),
      githubCommits: passport.stats.githubCommits,
      codewarsSolved: passport.stats.codewarsSolved,
      activeDays90: passport.stats.activeDays90,
      capturedAt: passport.generatedAt,
    };
  }

  /** Сводка прогресса для страницы «Мой прогресс». */
  async getProgress(userId: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const [progress, market] = await Promise.all([
      this.prisma.studentProgress.findUnique({ where: { studentId } }),
      this.gamification.getMarketComparison(studentId),
    ]);

    const score = progress?.skillScore ?? 0;
    const league = progress?.league ?? leagueForScore(score);
    const daysSinceActive = progress?.lastActiveDate
      ? Math.floor((Date.now() - progress.lastActiveDate.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    return {
      skillScore: score,
      league,
      leagueLabel: LEAGUE_LABELS[league],
      nextLeague: nextLeague(score),
      scoreBreakdown: (progress?.scoreBreakdown as Record<string, number>) ?? {
        streak: 0,
        volume: 0,
        social: 0,
      },
      currentStreak: progress?.currentStreak ?? 0,
      longestStreak: progress?.longestStreak ?? 0,
      consistency30: progress?.consistency30 ?? 0,
      streakFreezes: progress?.streakFreezes ?? 0,
      daysSinceActive,
      withering: daysSinceActive !== null && daysSinceActive > STREAK_GRACE_DAYS,
      market,
    };
  }

  /** Календарь активности (heatmap) за N дней. */
  async getActivity(userId: string, days = 140) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.dailyActivity.findMany({
      where: { studentId, date: { gte: since } },
      orderBy: { date: 'asc' },
      select: { date: true, count: true, sources: true },
    });
    return {
      from: toDayKey(since),
      to: toDayKey(new Date()),
      days: rows.map((r) => ({ date: toDayKey(r.date), count: r.count, sources: r.sources })),
    };
  }

  private statsOf<T>(
    integrations: { provider: string; stats: unknown }[],
    provider: string,
  ): T | null {
    return (integrations.find((i) => i.provider === provider)?.stats as T) ?? null;
  }
}
