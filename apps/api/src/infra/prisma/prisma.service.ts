import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Единственная точка доступа к PostgreSQL (см. CLAUDE.md §4).
 * Управляет жизненным циклом соединения вместе с приложением.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Соединение с PostgreSQL установлено');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
