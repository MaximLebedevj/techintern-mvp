import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './infra/prisma/prisma.module';
import { RedisModule } from './infra/redis/redis.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { SkillsModule } from './modules/skills/skills.module';
import { StudentsModule } from './modules/students/students.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { VacanciesModule } from './modules/vacancies/vacancies.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { CareerHubModule } from './modules/career-hub/career-hub.module';
import { MessagesModule } from './modules/messages/messages.module';
import { MatchingModule } from './modules/matching/matching.module';

/**
 * Корневой модуль. Конфигурация загружается под ключ `config`,
 * глобальные guard'ы обеспечивают аутентификацию (JWT) и проверку ролей,
 * throttler защищает от перебора (см. CLAUDE.md §4).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [() => ({ config: configuration() })],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    SkillsModule,
    StudentsModule,
    CompaniesModule,
    VacanciesModule,
    ApplicationsModule,
    CareerHubModule,
    MessagesModule,
    MatchingModule,
  ],
  controllers: [HealthController],
  providers: [
    // Порядок важен: throttling → аутентификация → проверка ролей.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
