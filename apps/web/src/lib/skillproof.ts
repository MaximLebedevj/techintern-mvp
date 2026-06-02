import {
  Award,
  BriefcaseBusiness,
  Flame,
  Gem,
  GitCommitHorizontal,
  GraduationCap,
  Languages,
  type LucideIcon,
  Swords,
} from 'lucide-react';
import type { League } from '@/types/skillproof';

export interface LeagueMeta {
  label: string;
  gradient: string; // tailwind-классы для фона-градиента
  text: string;
  ring: string; // hsl/hex для кольца
}

export const LEAGUE_META: Record<League, LeagueMeta> = {
  BRONZE: { label: 'Бронза', gradient: 'from-amber-700 to-amber-500', text: 'text-amber-600', ring: '#d97706' },
  SILVER: { label: 'Серебро', gradient: 'from-slate-400 to-slate-300', text: 'text-slate-500', ring: '#64748b' },
  GOLD: { label: 'Золото', gradient: 'from-yellow-500 to-amber-400', text: 'text-yellow-600', ring: '#eab308' },
  PLATINUM: { label: 'Платина', gradient: 'from-sky-500 to-cyan-400', text: 'text-sky-600', ring: '#0ea5e9' },
  DIAMOND: { label: 'Алмаз', gradient: 'from-violet-600 to-fuchsia-500', text: 'text-violet-600', ring: '#a855f7' },
};

const BADGE_ICONS: Record<string, LucideIcon> = {
  Flame,
  GitCommitHorizontal,
  Languages,
  Swords,
  GraduationCap,
  Gem,
  BriefcaseBusiness,
  Award,
};

export const badgeIcon = (name: string): LucideIcon => BADGE_ICONS[name] ?? Award;

export const TIER_RING: Record<string, string> = {
  bronze: 'ring-amber-500/40 bg-amber-500/10 text-amber-600',
  silver: 'ring-slate-400/40 bg-slate-400/10 text-slate-500',
  gold: 'ring-yellow-500/40 bg-yellow-500/10 text-yellow-600',
};

/** Цвет ячейки heatmap по интенсивности активности. */
export function heatColor(count: number): string {
  if (count <= 0) return 'bg-muted';
  if (count <= 2) return 'bg-primary/30';
  if (count <= 4) return 'bg-primary/55';
  if (count <= 6) return 'bg-primary/75';
  return 'bg-primary';
}
