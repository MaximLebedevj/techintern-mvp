import { Gem } from 'lucide-react';
import type { League } from '@/types/skillproof';
import { LEAGUE_META } from '@/lib/skillproof';
import { cn } from '@/lib/utils';

export function LeagueBadge({ league, className }: { league: League; className?: string }) {
  const meta = LEAGUE_META[league];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-bold text-white shadow-sm',
        meta.gradient,
        className,
      )}
    >
      <Gem className="size-3.5" />
      {meta.label}
    </span>
  );
}
