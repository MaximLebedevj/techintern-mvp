import { Module } from '@nestjs/common';
import { CareerHubController } from './career-hub.controller';
import { CareerHubService } from './career-hub.service';

@Module({
  controllers: [CareerHubController],
  providers: [CareerHubService],
})
export class CareerHubModule {}
