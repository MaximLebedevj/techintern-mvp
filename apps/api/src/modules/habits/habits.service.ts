import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GoalStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { ProgressService } from '../gamification/progress.service';
import { toDayKey } from '../gamification/streak';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
import { CheckinDto, CreateHabitDto } from './dto/habit.dto';

const CHECKIN_WINDOW_MS = 140 * 24 * 60 * 60 * 1000;

@Injectable()
export class HabitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly progress: ProgressService,
  ) {}

  // --- Цели (SMART) -----------------------------------------------------------

  async listGoals(userId: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    return this.prisma.goal.findMany({
      where: { studentId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createGoal(userId: string, dto: CreateGoalDto) {
    const studentId = await this.gamification.resolveStudentId(userId);
    return this.prisma.goal.create({
      data: {
        studentId,
        title: dto.title,
        specific: dto.specific,
        measurable: dto.measurable,
        metricTarget: dto.metricTarget,
        metricCurrent: dto.metricCurrent ?? 0,
        unit: dto.unit,
        skillSlug: dto.skillSlug,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  async updateGoal(userId: string, id: string, dto: UpdateGoalDto) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.studentId !== studentId) throw new NotFoundException('Цель не найдена');

    const metricTarget = dto.metricTarget ?? goal.metricTarget;
    const metricCurrent = dto.metricCurrent ?? goal.metricCurrent;
    const autoComplete =
      metricTarget != null && metricCurrent >= metricTarget && goal.status === 'ACTIVE';
    const status = dto.status ?? (autoComplete ? GoalStatus.COMPLETED : goal.status);

    return this.prisma.goal.update({
      where: { id },
      data: {
        title: dto.title,
        specific: dto.specific,
        measurable: dto.measurable,
        metricTarget: dto.metricTarget,
        metricCurrent: dto.metricCurrent,
        unit: dto.unit,
        skillSlug: dto.skillSlug,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status,
        completedAt: status === GoalStatus.COMPLETED ? (goal.completedAt ?? new Date()) : null,
      },
    });
  }

  async deleteGoal(userId: string, id: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.studentId !== studentId) throw new NotFoundException('Цель не найдена');
    await this.prisma.goal.delete({ where: { id } });
    return { success: true };
  }

  // --- Привычки ---------------------------------------------------------------

  async listHabits(userId: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const since = new Date(Date.now() - CHECKIN_WINDOW_MS);
    return this.prisma.habit.findMany({
      where: { studentId, archived: false },
      orderBy: { createdAt: 'asc' },
      include: {
        checkins: {
          where: { date: { gte: since } },
          orderBy: { date: 'asc' },
          select: { date: true, count: true },
        },
      },
    });
  }

  async createHabit(userId: string, dto: CreateHabitDto) {
    const studentId = await this.gamification.resolveStudentId(userId);
    return this.prisma.habit.create({
      data: {
        studentId,
        title: dto.title,
        cadence: dto.cadence ?? 'DAILY',
        targetPerPeriod: dto.targetPerPeriod ?? 1,
        skillSlug: dto.skillSlug,
        color: dto.color,
      },
    });
  }

  async archiveHabit(userId: string, id: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const habit = await this.prisma.habit.findUnique({ where: { id } });
    if (!habit || habit.studentId !== studentId) throw new NotFoundException('Привычка не найдена');
    await this.prisma.habit.update({ where: { id }, data: { archived: true } });
    return { success: true };
  }

  /** Отметка выполнения привычки — питает streak (пересчёт прогресса). */
  async checkin(userId: string, habitId: string, dto: CheckinDto) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit || habit.studentId !== studentId) throw new NotFoundException('Привычка не найдена');
    if (habit.studentId !== studentId) throw new ForbiddenException('Это не ваша привычка');

    const dayKey = dto.date ? toDayKey(new Date(dto.date)) : toDayKey(new Date());
    const date = new Date(dayKey);

    await this.prisma.habitCheckin.upsert({
      where: { habitId_date: { habitId, date } },
      create: { habitId, date, count: 1 },
      update: { count: { increment: 1 } },
    });

    const progress = await this.progress.recompute(studentId);
    return { success: true, date: dayKey, currentStreak: progress.currentStreak, skillScore: progress.skillScore };
  }
}
