import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Глобальный модуль: PrismaService доступен во всех контекстах без повторного импорта. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
