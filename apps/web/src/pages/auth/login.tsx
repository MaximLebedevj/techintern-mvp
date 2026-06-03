import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from './auth-shell';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { loginSchema, type LoginValues } from '@/lib/schemas';
import { getApiErrorMessage } from '@/lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/app';

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values.email, values.password);
      toast.success('С возвращением!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не удалось войти'));
    }
  };

  const fillDemo = (email: string) => {
    form.setValue('email', email);
    form.setValue('password', 'password123');
  };

  return (
    <AuthShell title="Вход в SkillProof" subtitle="Рады видеть вас снова">
      <OAuthButtons />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" type="password" placeholder="••••••••" {...form.register('password')} />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="gradient"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Войти
        </Button>
      </form>

      <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="mb-1.5 font-medium text-foreground">Демо-доступы:</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillDemo('student@skillproof.space')}
            className="rounded-md bg-card px-2 py-1 font-medium text-primary hover:underline"
          >
            Студент
          </button>
          <button
            type="button"
            onClick={() => fillDemo('company@skillproof.space')}
            className="rounded-md bg-card px-2 py-1 font-medium text-primary hover:underline"
          >
            Компания
          </button>
          <span className="self-center">пароль: password123</span>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </AuthShell>
  );
}
