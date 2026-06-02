import { Module } from '@nestjs/common';
import { MatchingModule } from '../matching/matching.module';
import { PassportModule } from '../passport/passport.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [MatchingModule, PassportModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
