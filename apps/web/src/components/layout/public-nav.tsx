import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { useAuth } from '@/hooks/use-auth';

export function PublicNav() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button asChild variant="gradient">
              <Link to="/app">Открыть приложение</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">Войти</Link>
              </Button>
              <Button asChild variant="gradient">
                <Link to="/register">Начать бесплатно</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
