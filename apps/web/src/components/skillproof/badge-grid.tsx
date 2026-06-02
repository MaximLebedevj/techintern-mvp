import { Lock } from 'lucide-react';
import { badgeIcon, TIER_RING } from '@/lib/skillproof';
import { cn } from '@/lib/utils';

interface BadgeItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier?: string | null;
}

export function BadgeGrid({
  badges,
  earnedKeys,
}: {
  badges: BadgeItem[];
  earnedKeys?: Set<string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {badges.map((badge) => {
        const earned = !earnedKeys || earnedKeys.has(badge.key);
        const Icon = earned ? badgeIcon(badge.icon) : Lock;
        const ring = badge.tier ? TIER_RING[badge.tier] : 'ring-primary/30 bg-primary/10 text-primary';
        return (
          <div
            key={badge.key}
            title={badge.description}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-all',
              !earned && 'opacity-50 grayscale',
            )}
          >
            <span className={cn('grid size-11 place-items-center rounded-full ring-2', earned ? ring : 'bg-muted text-muted-foreground ring-border')}>
              <Icon className="size-5" />
            </span>
            <span className="text-xs font-semibold leading-tight">{badge.title}</span>
          </div>
        );
      })}
    </div>
  );
}
