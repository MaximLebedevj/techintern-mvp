import { NavLink } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Logo } from '@/components/common/logo';
import type { NavItem } from './nav-config';
import { cn } from '@/lib/utils';

interface SidebarProps {
  items: NavItem[];
  onNavigate?: () => void;
  isStudent: boolean;
}

export function Sidebar({ items, onNavigate, isStudent }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('size-[18px]', isActive && 'text-primary')} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {isStudent && (
        <div className="m-3 rounded-2xl border border-primary/20 bg-brand-gradient/5 bg-gradient-to-br from-primary/10 to-fuchsia-500/10 p-4">
          <Sparkles className="size-5 text-primary" />
          <p className="mt-2 text-sm font-semibold">Career Hub</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Гайды и разборы кода для подготовки к собеседованию.
          </p>
        </div>
      )}
    </div>
  );
}
