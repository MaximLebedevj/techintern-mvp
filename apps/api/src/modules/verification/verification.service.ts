import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IntegrationProvider, Prisma, ProofSource } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { ProgressService } from '../gamification/progress.service';
import { GithubService } from './github.service';
import { CodewarsService } from './codewars.service';
import type { ProviderSyncResult } from './verification.types';

const PROVIDER_SOURCE: Record<IntegrationProvider, ProofSource> = {
  GITHUB: ProofSource.GITHUB,
  CODEWARS: ProofSource.CODEWARS,
  LEETCODE: ProofSource.LEETCODE,
  STEPIK: ProofSource.MANUAL,
};

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly progress: ProgressService,
    private readonly github: GithubService,
    private readonly codewars: CodewarsService,
  ) {}

  async list(userId: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    return this.prisma.integration.findMany({
      where: { studentId },
      orderBy: { provider: 'asc' },
    });
  }

  /** Подключает/обновляет интеграцию и синхронизирует данные. */
  async sync(userId: string, provider: IntegrationProvider, usernameArg?: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    const service = this.pickService(provider);

    const existing = await this.prisma.integration.findUnique({
      where: { studentId_provider: { studentId, provider } },
    });
    const username = (usernameArg ?? existing?.username)?.trim();
    if (!username) throw new BadRequestException('Не указан логин аккаунта');

    await this.prisma.integration.upsert({
      where: { studentId_provider: { studentId, provider } },
      create: { studentId, provider, username, status: 'SYNCING' },
      update: { username, status: 'SYNCING' },
    });

    const result = await service.sync(username);
    if (!result.ok) {
      await this.prisma.integration.update({
        where: { studentId_provider: { studentId, provider } },
        data: { status: 'ERROR' },
      });
      throw new NotFoundException(`Аккаунт «${username}» не найден на ${provider}`);
    }

    const source = PROVIDER_SOURCE[provider];
    await this.prisma.$transaction([
      this.prisma.activityProof.deleteMany({ where: { studentId, source } }),
      this.prisma.activityProof.createMany({
        data: result.proofs.map((p) => ({
          studentId,
          source,
          type: p.type,
          title: p.title,
          url: p.url,
          occurredAt: p.occurredAt,
          weight: p.weight,
          skillSlugs: p.skillSlugs,
        })),
      }),
      this.prisma.integration.update({
        where: { studentId_provider: { studentId, provider } },
        data: {
          status: 'CONNECTED',
          stats: result.stats as Prisma.InputJsonValue,
          lastSyncedAt: new Date(),
        },
      }),
    ]);

    const progress = await this.progress.recompute(studentId);
    return {
      provider,
      username,
      proofsAdded: result.proofs.length,
      stats: result.stats,
      progress,
    };
  }

  async disconnect(userId: string, provider: IntegrationProvider) {
    const studentId = await this.gamification.resolveStudentId(userId);
    await this.prisma.$transaction([
      this.prisma.activityProof.deleteMany({ where: { studentId, source: PROVIDER_SOURCE[provider] } }),
      this.prisma.integration.deleteMany({ where: { studentId, provider } }),
    ]);
    await this.progress.recompute(studentId);
    return { success: true };
  }

  private pickService(provider: IntegrationProvider): { sync(username: string): Promise<ProviderSyncResult> } {
    if (provider === 'GITHUB') return this.github;
    if (provider === 'CODEWARS') return this.codewars;
    throw new BadRequestException(`Провайдер ${provider} пока не поддерживается`);
  }
}
