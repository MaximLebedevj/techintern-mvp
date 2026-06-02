/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger } from '@nestjs/common';
import type { ProviderProof, ProviderSyncResult } from './verification.types';

/**
 * Верификация GitHub через ПУБЛИЧНЫЙ REST API (без OAuth-токена пользователя).
 * Считает репозитории, звёзды, языки, события (коммиты/PR/issues).
 * Опционально использует серверный GITHUB_TOKEN для повышения лимитов.
 * Все запросы устойчивы к сбоям: при ошибке деградируем, а не падаем.
 */
@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly base = 'https://api.github.com';

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'TechIntern-SkillProof',
      Accept: 'application/vnd.github+json',
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    return headers;
  }

  private async get(path: string): Promise<any | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${this.base}${path}`, {
        headers: this.headers(),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      this.logger.warn(`GitHub запрос не удался ${path}: ${(err as Error).message}`);
      return null;
    }
  }

  async sync(username: string): Promise<ProviderSyncResult> {
    const user = await this.get(`/users/${encodeURIComponent(username)}`);
    if (!user || !user.login) return { ok: false, stats: {}, proofs: [] };

    const repos: any[] = (await this.get(`/users/${user.login}/repos?per_page=100&sort=pushed`)) ?? [];
    const stars = repos.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);
    const languages = Array.from(
      new Set(repos.map((r) => r.language).filter(Boolean).map((l: string) => l.toLowerCase())),
    );

    const events: any[] = (await this.get(`/users/${user.login}/events/public?per_page=100`)) ?? [];
    const proofs = this.proofsFromEvents(events);

    // Сводные счётчики через Search API (best-effort, могут упереться в лимиты).
    const [commitsSearch, prSearch, issueSearch] = await Promise.all([
      this.get(`/search/commits?q=author:${user.login}&per_page=1`),
      this.get(`/search/issues?q=author:${user.login}+type:pr&per_page=1`),
      this.get(`/search/issues?q=author:${user.login}+type:issue&per_page=1`),
    ]);

    const commitsFromEvents = proofs
      .filter((p) => p.type === 'COMMIT')
      .reduce((sum, p) => sum + Math.round(p.weight / 0.4), 0);

    const stats = {
      username: user.login,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      repos: user.public_repos ?? repos.length,
      followers: user.followers ?? 0,
      stars,
      languages,
      commits: commitsSearch?.total_count ?? commitsFromEvents,
      pullRequests: prSearch?.total_count ?? proofs.filter((p) => p.type === 'PULL_REQUEST').length,
      issues: issueSearch?.total_count ?? proofs.filter((p) => p.type === 'ISSUE').length,
    };

    return { ok: true, stats, proofs };
  }

  private proofsFromEvents(events: any[]): ProviderProof[] {
    const proofs: ProviderProof[] = [];
    for (const event of events) {
      const occurredAt = new Date(event.created_at);
      const repo = event.repo?.name ?? 'репозитории';
      const url = event.repo?.name ? `https://github.com/${event.repo.name}` : undefined;

      if (event.type === 'PushEvent') {
        const commits = event.payload?.commits?.length ?? event.payload?.size ?? 1;
        proofs.push({
          type: 'COMMIT',
          title: `${commits} коммит(ов) в ${repo}`,
          url,
          occurredAt,
          weight: Math.min(commits, 8) * 0.4,
          skillSlugs: [],
        });
      } else if (event.type === 'PullRequestEvent' && event.payload?.action === 'opened') {
        proofs.push({ type: 'PULL_REQUEST', title: `Pull Request в ${repo}`, url, occurredAt, weight: 2, skillSlugs: [] });
      } else if (event.type === 'IssuesEvent' && event.payload?.action === 'opened') {
        proofs.push({ type: 'ISSUE', title: `Issue в ${repo}`, url, occurredAt, weight: 1, skillSlugs: [] });
      } else if (event.type === 'CreateEvent' && event.payload?.ref_type === 'repository') {
        proofs.push({ type: 'PROJECT', title: `Новый репозиторий ${repo}`, url, occurredAt, weight: 1.5, skillSlugs: [] });
      }
    }
    return proofs;
  }
}
