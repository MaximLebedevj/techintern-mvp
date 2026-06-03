/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger } from '@nestjs/common';
import type { ProviderProof, ProviderSyncResult } from './verification.types';

/**
 * Верификация Codewars через публичный API (без токена).
 * Считает honor, решённые задачи, ранг и языки.
 */
@Injectable()
export class CodewarsService {
  private readonly logger = new Logger(CodewarsService.name);
  private readonly base = 'https://www.codewars.com/api/v1';

  private async get(path: string): Promise<any | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${this.base}${path}`, {
        headers: { 'User-Agent': 'SkillProof' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      this.logger.warn(`Codewars запрос не удался ${path}: ${(err as Error).message}`);
      return null;
    }
  }

  async sync(username: string): Promise<ProviderSyncResult> {
    const user = await this.get(`/users/${encodeURIComponent(username)}`);
    if (!user || !user.username) return { ok: false, stats: {}, proofs: [] };

    const completed = await this.get(`/users/${user.username}/code-challenges/completed?page=0`);
    const solved = completed?.totalItems ?? user.codeChallenges?.totalCompleted ?? 0;

    const stats = {
      username: user.username,
      honor: user.honor ?? 0,
      solved,
      rank: user.ranks?.overall?.name ?? null,
      languages: Object.keys(user.ranks?.languages ?? {}),
    };

    const proofs: ProviderProof[] = (completed?.data ?? [])
      .slice(0, 30)
      .filter((item: any) => item.completedAt)
      .map((item: any) => ({
        type: 'PROBLEM_SOLVED' as const,
        title: `Решена задача: ${item.name}`,
        url: `https://www.codewars.com/kata/${item.id}`,
        occurredAt: new Date(item.completedAt),
        weight: 1,
        skillSlugs: (item.completedLanguages ?? []).map((l: string) => l.toLowerCase()),
      }));

    return { ok: true, stats, proofs };
  }
}
