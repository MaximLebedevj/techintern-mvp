import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import type { ApplicationStatus } from '@/types/api';
import { APPLICATION_STATUS_META, TRACKER_FLOW } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface StatusTrackerProps {
  status: ApplicationStatus;
  className?: string;
  compact?: boolean;
}

/** Визуальный трекер отклика: ⏳ На рассмотрении → ✅ Приглашение → 🎯 Оффер. */
export function StatusTracker({ status, className, compact = false }: StatusTrackerProps) {
  if (status === 'REJECTED') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive',
          className,
        )}
      >
        <XCircle className="size-4" />
        Отказ — не сдавайтесь, впереди новые возможности!
      </div>
    );
  }

  const currentIndex = TRACKER_FLOW.indexOf(status);

  return (
    <div className={cn('flex items-center', className)}>
      {TRACKER_FLOW.map((step, index) => {
        const meta = APPLICATION_STATUS_META[step];
        const reached = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{ scale: isCurrent ? 1.08 : 1 }}
                className={cn(
                  'grid place-items-center rounded-full border-2 transition-colors',
                  compact ? 'size-8 text-sm' : 'size-11 text-lg',
                  reached
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-muted text-muted-foreground grayscale',
                )}
              >
                <span>{meta.emoji}</span>
              </motion.div>
              {!compact && (
                <span
                  className={cn(
                    'text-center text-xs font-medium',
                    reached ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {meta.label}
                </span>
              )}
            </div>
            {index < TRACKER_FLOW.length - 1 && (
              <div className="relative mx-1 h-0.5 flex-1 self-start rounded-full bg-border" style={{ marginTop: compact ? 15 : 21 }}>
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: index < currentIndex ? 1 : 0 }}
                  style={{ originX: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
