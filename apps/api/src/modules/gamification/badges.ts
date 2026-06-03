import type { League } from '@prisma/client';

/** Описание бейджа для каталога (сидируется в БД). */
export interface BadgeDef {
  key: string;
  title: string;
  description: string;
  icon: string; // имя lucide-иконки
  category: 'DISCIPLINE' | 'TECH' | 'EMPLOYMENT' | 'SOCIAL';
  tier?: 'bronze' | 'silver' | 'gold';
}

export const BADGE_CATALOG: BadgeDef[] = [
  { key: 'streak-7', title: 'Неделя дисциплины', description: '7 дней активности подряд', icon: 'Flame', category: 'DISCIPLINE', tier: 'bronze' },
  { key: 'streak-30', title: 'Месяц без пропусков', description: '30 дней активности подряд', icon: 'Flame', category: 'DISCIPLINE', tier: 'silver' },
  { key: 'streak-100', title: 'Сто дней огня', description: '100 дней активности подряд', icon: 'Flame', category: 'DISCIPLINE', tier: 'gold' },
  { key: 'commits-100', title: 'Сотня коммитов', description: '100+ коммитов на GitHub', icon: 'GitCommitHorizontal', category: 'TECH', tier: 'bronze' },
  { key: 'commits-500', title: 'Машина коммитов', description: '500+ коммитов на GitHub', icon: 'GitCommitHorizontal', category: 'TECH', tier: 'silver' },
  { key: 'polyglot', title: 'Полиглот', description: '3+ языка программирования', icon: 'Languages', category: 'TECH', tier: 'silver' },
  { key: 'codewars-50', title: 'Решатель задач', description: '50+ задач на Codewars', icon: 'Swords', category: 'TECH', tier: 'bronze' },
  { key: 'careerhub-grad', title: 'Выпускник Career Hub', description: '5+ пройденных материалов', icon: 'GraduationCap', category: 'DISCIPLINE', tier: 'silver' },
  { key: 'diamond-league', title: 'Алмазная лига', description: 'Достигнут Diamond', icon: 'Gem', category: 'SOCIAL', tier: 'gold' },
  { key: 'hired', title: 'Трудоустроен', description: 'Получен оффер через SkillProof', icon: 'BriefcaseBusiness', category: 'EMPLOYMENT', tier: 'gold' },
];

export interface BadgeContext {
  currentStreak: number;
  longestStreak: number;
  githubCommits: number;
  languages: number;
  codewarsSolved: number;
  guidesCompleted: number;
  offers: number;
  league: League;
}

/** Возвращает ключи заслуженных бейджей. */
export function evaluateBadges(ctx: BadgeContext): string[] {
  const earned: string[] = [];
  const streak = Math.max(ctx.currentStreak, ctx.longestStreak);

  if (streak >= 7) earned.push('streak-7');
  if (streak >= 30) earned.push('streak-30');
  if (streak >= 100) earned.push('streak-100');
  if (ctx.githubCommits >= 100) earned.push('commits-100');
  if (ctx.githubCommits >= 500) earned.push('commits-500');
  if (ctx.languages >= 3) earned.push('polyglot');
  if (ctx.codewarsSolved >= 50) earned.push('codewars-50');
  if (ctx.guidesCompleted >= 5) earned.push('careerhub-grad');
  if (ctx.league === 'DIAMOND') earned.push('diamond-league');
  if (ctx.offers >= 1) earned.push('hired');

  return earned;
}
