import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/** Глобальный модуль кеша / хранилища токенов. */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
