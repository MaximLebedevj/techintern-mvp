import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Prisma, SkillCategory } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BADGE_CATALOG } from './badges';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveStudentId(userId: string): Promise<string> {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new ForbiddenException('Профиль студента не найден');
    return profile.id;
  }

  /** Лидерборд по Skill Score (опц. в рамках направления). */
  async getLeaderboard(specialization?: SkillCategory, limit = 20) {
    const where: Prisma.StudentProgressWhereInput = specialization
      ? { student: { specialization } }
      : {};

    const rows = await this.prisma.studentProgress.findMany({
      where,
      orderBy: { skillScore: 'desc' },
      take: limit,
      include: {
        student: {
          select: { id: true, fullName: true, avatarUrl: true, specialization: true },
        },
      },
    });

    return rows.map((row, index) => ({
      rank: index + 1,
      studentId: row.studentId,
      fullName: row.student.fullName,
      avatarUrl: row.student.avatarUrl,
      specialization: row.student.specialization,
      skillScore: row.skillScore,
      league: row.league,
      currentStreak: row.currentStreak,
    }));
  }

  /** Сравнение с рынком: топ-X% в своём направлении. */
  async getMarketComparison(studentId: string) {
    const me = await this.prisma.studentProgress.findUnique({
      where: { studentId },
      include: { student: { select: { specialization: true } } },
    });
    if (!me) return null;

    const specialization = me.student.specialization;
    const where: Prisma.StudentProgressWhereInput = specialization
      ? { student: { specialization } }
      : {};

    const [total, lower] = await Promise.all([
      this.prisma.studentProgress.count({ where }),
      this.prisma.studentProgress.count({
        where: { ...where, skillScore: { lt: me.skillScore } },
      }),
    ]);

    const topPercent = total > 1 ? Math.max(1, Math.round(100 - (lower / (total - 1)) * 100)) : 1;
    return {
      specialization,
      total,
      rank: total - lower,
      topPercent, // «топ-X%»
    };
  }

  async getMyBadges(studentId: string) {
    return this.prisma.studentBadge.findMany({
      where: { studentId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });
  }

  getBadgeCatalog() {
    return BADGE_CATALOG;
  }
}
