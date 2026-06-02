import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';

/** Гильдии и дуэли 1v1. */
@Module({
  imports: [GamificationModule],
  controllers: [ChallengesController],
  providers: [ChallengesService],
})
export class ChallengesModule {}
