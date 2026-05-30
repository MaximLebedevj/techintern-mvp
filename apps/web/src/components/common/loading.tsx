import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-muted-foreground', className)} />;
}

/** Полноэкранный лоадер (используется при восстановлении сессии). */
export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Logo size="lg" withText={false} className="animate-glow-pulse" />
      <Spinner />
    </div>
  );
}
