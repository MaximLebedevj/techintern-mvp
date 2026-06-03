import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from './auth-shell';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { registerSchema, type RegisterValues } from '@/lib/schemas';
import { getApiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role: 'STUDENT' },
  });

  const role = form.watch('role');

  const onSubmit = async (values: RegisterValues) => {
    try {
      await registerUser(values);
      toast.success('Аккаунт создан! Добро пожаловать в SkillProof');
      navigate('/app', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не удалось зарегистрироваться'));
    }
  };

  return (
    <AuthShell title="Создать аккаунт" subtitle="Бесплатно для студентов">
      <div className="mb-6 grid grid-cols-2 gap-3">
        <RoleOption
          active={role === 'STUDENT'}
          icon={GraduationCap}
          label="Я студент"
          hint="Ищу стажировку"
          onClick={() => form.setValue('role', 'STUDENT')}
        />
        <RoleOption
          active={role === 'COMPANY'}
          icon={Building2}
          label="Я компания"
          hint="Ищу таланты"
          onClick={() => form.setValue('role', 'COMPANY')}
        />
      </div>

      <OAuthButtons />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{role === 'COMPANY' ? 'Название компании' : 'Имя и фамилия'}</Label>
          <Input
            id="name"
            placeholder={role === 'COMPANY' ? 'DevHorizon' : 'Иван Иванов'}
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" type="password" placeholder="Минимум 8 символов" {...form.register('password')} />
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
          Создать аккаунт
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </AuthShell>
  );
}

function RoleOption({
  active,
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: typeof Building2;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all',
        active
          ? 'border-primary bg-accent shadow-sm'
          : 'border-border hover:border-primary/40 hover:bg-muted/50',
      )}
    >
      <Icon className={cn('size-5', active ? 'text-primary' : 'text-muted-foreground')} />
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}
