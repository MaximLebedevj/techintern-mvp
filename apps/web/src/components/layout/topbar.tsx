import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { UserMenu } from './user-menu';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border glass px-4 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Меню"
      >
        <Menu className="size-5" />
      </Button>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
