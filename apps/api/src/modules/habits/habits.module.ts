import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

/** Трекер SMART-целей и привычек (check-in питает streak). */
@Module({
  imports: [GamificationModule],
  controllers: [HabitsController],
  providers: [HabitsService],
})
export class HabitsModule {}
