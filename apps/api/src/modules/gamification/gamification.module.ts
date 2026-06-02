import { Module } from '@nestjs/common';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { ProgressService } from './progress.service';

/** Геймификация: Skill Score, лиги, бейджи, лидерборд + пересчёт прогресса. */
@Module({
  controllers: [GamificationController],
  providers: [GamificationService, ProgressService],
  exports: [GamificationService, ProgressService],
})
export class GamificationModule {}
