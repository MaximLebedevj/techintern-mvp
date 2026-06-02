import type { League } from '@prisma/client';

/** Пороги лиг по Skill Score (0..1000). */
export const LEAGUE_THRESHOLDS: { league: League; min: number }[] = [
  { league: 'DIAMOND', min: 800 },
  { league: 'PLATINUM', min: 600 },
  { league: 'GOLD', min: 400 },
  { league: 'SILVER', min: 200 },
  { league: 'BRONZE', min: 0 },
];

export const LEAGUE_ORDER: League[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

export const LEAGUE_LABELS: Record<League, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото',
  PLATINUM: 'Платина',
  DIAMOND: 'Алмаз',
};

export function leagueForScore(score: number): League {
  return LEAGUE_THRESHOLDS.find((t) => score >= t.min)?.league ?? 'BRONZE';
}

/** Следующая лига и сколько баллов до неё (null, если уже максимум). */
export function nextLeague(score: number): { league: League; pointsTo: number } | null {
  const current = leagueForScore(score);
  const idx = LEAGUE_ORDER.indexOf(current);
  if (idx >= LEAGUE_ORDER.length - 1) return null;
  const next = LEAGUE_ORDER[idx + 1]!;
  const min = LEAGUE_THRESHOLDS.find((t) => t.league === next)!.min;
  return { league: next, pointsTo: Math.max(0, min - score) };
}
