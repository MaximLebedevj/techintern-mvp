import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { GithubService } from './github.service';
import { CodewarsService } from './codewars.service';

/** Верифицированные интеграции (GitHub, Codewars) → доказательства активности. */
@Module({
  imports: [GamificationModule],
  controllers: [VerificationController],
  providers: [VerificationService, GithubService, CodewarsService],
  exports: [VerificationService],
})
export class VerificationModule {}
