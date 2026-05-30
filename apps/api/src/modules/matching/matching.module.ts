import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';

/** Доменное ядро AI-скоринга. Экспортирует MatchingService другим контекстам. */
@Module({
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
