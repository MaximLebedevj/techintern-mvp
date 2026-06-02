import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module';
import { PassportController } from './passport.controller';
import { PassportService } from './passport.service';

/** Skill Proof Passport — сборка живого верифицированного паспорта навыков. */
@Module({
  imports: [GamificationModule],
  controllers: [PassportController],
  providers: [PassportService],
  exports: [PassportService],
})
export class PassportModule {}
