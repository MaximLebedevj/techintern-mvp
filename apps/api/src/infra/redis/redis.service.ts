import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { AppConfig } from '../../config/configuration';

/**
 * Обёртка над Redis: кеш матчинга и хранилище refresh-токенов (rotation/revoke).
 * Все операции best-effort: при недоступности Redis приложение не падает,
 * а пишет предупреждение и деградирует (без кеша). См. CLAUDE.md §4.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private isReady = false;

  constructor(@Inject(ConfigService) config: ConfigService<{ config: AppConfig }>) {
    const url = config.get('config.redis.url', { infer: true }) as string;
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    this.client.on('ready', () => {
      this.isReady = true;
      this.logger.log('Соединение с Redis установлено');
    });
    this.client.on('error', (err) => {
      if (this.isReady) this.logger.warn(`Redis недоступен: ${err.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err) {
      this.logger.warn(
        `Не удалось подключиться к Redis при старте — продолжаю без кеша (${(err as Error).message})`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) await this.client.set(key, value, 'EX', ttlSeconds);
      else await this.client.set(key, value);
    } catch {
      /* best-effort: игнорируем сбой кеша */
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      /* best-effort */
    }
  }

  /** Удаление по шаблону ключей (например, инвалидация кеша матчинга вакансии). */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length) await this.client.del(keys);
    } catch {
      /* best-effort */
    }
  }
}
