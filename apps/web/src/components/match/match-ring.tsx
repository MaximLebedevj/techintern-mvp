import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MatchRingProps {
  score: number; // 0..100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

/** Цветовой тон по уровню совпадения. */
export function scoreTone(score: number): { stroke: string; text: string; label: string } {
  if (score >= 80) return { stroke: 'hsl(var(--success))', text: 'text-success', label: 'Отлично' };
  if (score >= 55) return { stroke: 'hsl(var(--primary))', text: 'text-primary', label: 'Хорошо' };
  if (score >= 30)
    return { stroke: 'hsl(var(--warning))', text: 'text-warning', label: 'Частично' };
  return { stroke: 'hsl(var(--muted-foreground))', text: 'text-muted-foreground', label: 'Низко' };
}

export function MatchRing({
  score,
  size = 96,
  strokeWidth = 8,
  showLabel = true,
  className,
}: MatchRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const tone = scoreTone(clamped);

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-display text-xl font-bold leading-none', tone.text)}>
          {clamped}%
        </span>
        {showLabel && <span className="mt-0.5 text-[10px] text-muted-foreground">match</span>}
      </div>
    </div>
  );
}
