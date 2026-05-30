import { useNavigate } from 'react-router-dom';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useThemeStore, type Theme } from '@/stores/theme-store';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor },
];

export function SettingsPage() {
  const { user, logout } = useAuth();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из аккаунта');
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Настройки" description="Управление аккаунтом и внешним видом." />

      <Card>
        <CardHeader>
          <CardTitle>Аккаунт</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Email" value={user?.email ?? '—'} />
          <Row
            label="Роль"
            value={user?.role === 'COMPANY' ? 'Компания' : user?.role === 'STUDENT' ? 'Студент' : '—'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Тема оформления</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  theme === option.value
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-primary/40',
                )}
              >
                <option.icon
                  className={cn(
                    'size-5',
                    theme === option.value ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="font-medium">Выйти из аккаунта</p>
            <p className="text-sm text-muted-foreground">Завершить текущую сессию</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-destructive">
            <LogOut className="size-4" />
            Выйти
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
