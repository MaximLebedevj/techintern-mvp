import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateStudentProfile } from '@/hooks/use-students';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATEGORY_OPTIONS, SENIORITY_OPTIONS } from '@/lib/constants';
import { studentProfileSchema, type StudentProfileValues } from '@/lib/schemas';
import { getApiErrorMessage } from '@/lib/api';
import type { StudentProfile } from '@/types/api';

export function ProfileEditDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile;
}) {
  const update = useUpdateStudentProfile();

  const form = useForm<StudentProfileValues>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      fullName: profile.fullName,
      headline: profile.headline ?? '',
      bio: profile.bio ?? '',
      city: profile.city ?? '',
      university: profile.university ?? '',
      course: profile.course ?? undefined,
      specialization: profile.specialization ?? undefined,
      level: profile.level,
      experienceYears: profile.experienceYears,
      githubUrl: profile.githubUrl ?? '',
      telegram: profile.telegram ?? '',
      websiteUrl: profile.websiteUrl ?? '',
      openToWork: profile.openToWork,
    },
  });

  const onSubmit = async (values: StudentProfileValues) => {
    try {
      await update.mutateAsync(values);
      toast.success('Профиль обновлён');
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не удалось сохранить профиль'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактирование профиля</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ScrollArea className="h-[60vh] pr-3">
            <div className="space-y-4">
              <FieldRow>
                <Field label="Имя и фамилия" error={form.formState.errors.fullName?.message}>
                  <Input {...form.register('fullName')} />
                </Field>
                <Field label="Город">
                  <Input placeholder="Москва" {...form.register('city')} />
                </Field>
              </FieldRow>

              <Field label="Заголовок профиля" error={form.formState.errors.headline?.message}>
                <Input placeholder="Frontend-разработчик, ищу стажировку" {...form.register('headline')} />
              </Field>

              <Field label="О себе">
                <Textarea placeholder="Коротко о вашем опыте и целях" {...form.register('bio')} />
              </Field>

              <FieldRow>
                <Field label="Университет">
                  <Input {...form.register('university')} />
                </Field>
                <Field label="Курс">
                  <Input type="number" min={1} max={6} {...form.register('course')} />
                </Field>
              </FieldRow>

              <FieldRow>
                <Field label="Специализация">
                  <Controller
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Уровень">
                  <Controller
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SENIORITY_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </FieldRow>

              <FieldRow>
                <Field label="Опыт (лет)">
                  <Input type="number" step={0.5} min={0} {...form.register('experienceYears')} />
                </Field>
                <Field label="Telegram">
                  <Input placeholder="@username" {...form.register('telegram')} />
                </Field>
              </FieldRow>

              <FieldRow>
                <Field label="GitHub" error={form.formState.errors.githubUrl?.message}>
                  <Input placeholder="https://github.com/…" {...form.register('githubUrl')} />
                </Field>
                <Field label="Сайт / портфолио" error={form.formState.errors.websiteUrl?.message}>
                  <Input placeholder="https://…" {...form.register('websiteUrl')} />
                </Field>
              </FieldRow>

              <Controller
                control={form.control}
                name="openToWork"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">Открыт к предложениям</p>
                      <p className="text-xs text-muted-foreground">
                        Профиль виден компаниям в поиске кандидатов
                      </p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="gradient" disabled={update.isPending}>
              {update.isPending && <Loader2 className="size-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
