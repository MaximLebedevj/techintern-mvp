import { Module } from '@nestjs/common';
import { MatchingModule } from '../matching/matching.module';
import { SkillsModule } from '../skills/skills.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [SkillsModule, MatchingModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
