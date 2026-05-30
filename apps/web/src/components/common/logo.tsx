import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  withText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { box: 'size-7', text: 'text-base' },
  md: { box: 'size-9', text: 'text-lg' },
  lg: { box: 'size-11', text: 'text-xl' },
};

export function Logo({ className, withText = true, size = 'md' }: LogoProps) {
  const s = sizeMap[size];
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'grid place-items-center rounded-xl bg-brand-gradient text-white shadow-glow',
          s.box,
        )}
      >
        <svg viewBox="0 0 24 24" className="size-[60%]" fill="none">
          <path
            d="M6 8.5L10 12L6 15.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12.5 16H18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      {withText && (
        <span className={cn('font-display font-extrabold tracking-tight', s.text)}>
          Tech<span className="text-gradient">Intern</span>
        </span>
      )}
    </span>
  );
}
