import { motion } from 'framer-motion';
import type { League } from '@/types/skillproof';
import { LEAGUE_META } from '@/lib/skillproof';
import { cn } from '@/lib/utils';

interface SkillScoreRingProps {
  score: number; // 0..1000
  league: League;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function SkillScoreRing({
  score,
  league,
  size = 160,
  strokeWidth = 12,
  className,
}: SkillScoreRingProps) {
  const meta = LEAGUE_META[league];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, score / 1000));
  const offset = circumference - pct * circumference;

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={meta.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Skill Score
        </span>
        <span className="font-display text-4xl font-extrabold leading-none tabular-nums">
          {score}
        </span>
        <span className={cn('mt-1 text-sm font-semibold', meta.text)}>{meta.label}</span>
      </div>
    </div>
  );
}
