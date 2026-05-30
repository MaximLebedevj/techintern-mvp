import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo size="lg" />
      <div>
        <p className="font-display text-6xl font-extrabold text-gradient">404</p>
        <h1 className="mt-2 text-xl font-semibold">Страница не найдена</h1>
        <p className="mt-1 text-muted-foreground">
          Возможно, ссылка устарела или страница была перемещена.
        </p>
      </div>
      <Button asChild variant="gradient">
        <Link to="/">На главную</Link>
      </Button>
    </div>
  );
}
