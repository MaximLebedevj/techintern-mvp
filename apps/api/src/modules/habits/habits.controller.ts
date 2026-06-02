import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HabitsService } from './habits.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
import { CheckinDto, CreateHabitDto } from './dto/habit.dto';

@ApiTags('habits')
@Roles(Role.STUDENT)
@Controller()
export class HabitsController {
  constructor(private readonly habits: HabitsService) {}

  // --- Цели ---
  @Get('goals')
  @ApiOperation({ summary: 'Мои SMART-цели' })
  listGoals(@CurrentUser('id') userId: string) {
    return this.habits.listGoals(userId);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Создать цель' })
  createGoal(@CurrentUser('id') userId: string, @Body() dto: CreateGoalDto) {
    return this.habits.createGoal(userId, dto);
  }

  @Patch('goals/:id')
  @ApiOperation({ summary: 'Обновить цель / прогресс' })
  updateGoal(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.habits.updateGoal(userId, id, dto);
  }

  @Delete('goals/:id')
  @ApiOperation({ summary: 'Удалить цель' })
  deleteGoal(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.habits.deleteGoal(userId, id);
  }

  // --- Привычки ---
  @Get('habits')
  @ApiOperation({ summary: 'Мои привычки с отметками' })
  listHabits(@CurrentUser('id') userId: string) {
    return this.habits.listHabits(userId);
  }

  @Post('habits')
  @ApiOperation({ summary: 'Создать привычку' })
  createHabit(@CurrentUser('id') userId: string, @Body() dto: CreateHabitDto) {
    return this.habits.createHabit(userId, dto);
  }

  @Post('habits/:id/checkin')
  @ApiOperation({ summary: 'Отметить выполнение привычки' })
  checkin(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: CheckinDto) {
    return this.habits.checkin(userId, id, dto);
  }

  @Delete('habits/:id')
  @ApiOperation({ summary: 'Архивировать привычку' })
  archiveHabit(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.habits.archiveHabit(userId, id);
  }
}
