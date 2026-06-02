import type { ProofType } from '@prisma/client';

/** Доказательство активности, полученное от внешнего провайдера. */
export interface ProviderProof {
  type: ProofType;
  title: string;
  url?: string;
  occurredAt: Date;
  weight: number;
  skillSlugs: string[];
}

/** Результат синхронизации внешнего аккаунта. */
export interface ProviderSyncResult {
  ok: boolean;
  stats: Record<string, unknown>;
  proofs: ProviderProof[];
}
