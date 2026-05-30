import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateVacancy, useUpdateVacancy } from '@/hooks/use-companies';
import { useVacancy } from '@/hooks/use-vacancies';
import { useSkillCatalog } from '@/hooks/use-students';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CATEGORY_LABELS,
  EMPLOYMENT_OPTIONS,
  SENIORITY_OPTIONS,
  WORK_FORMAT_OPTIONS,
} from '@/lib/constants';
import { vacancySchema, type VacancyFormValues } from '@/lib/schemas';
import { getApiErrorMessage } from '@/lib/api';
import type { Skill, SkillCategory } from '@/types/api';
import { cn } from '@/lib/utils';

export function PostVacancyPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { data: existing } = useVacancy(isEdit ? id : undefined);
  const create = useCreateVacancy();
  const update = useUpdateVacancy();

  const form = useForm<VacancyFormValues>({
    resolver: zodResolver(vacancySchema),
    defaultValues: {
      title: '',
      description: '',
      responsibilities: [],
      requirements: [],
      conditions: [],
      city: '',
      workFormat: 'OFFICE',
      employmentType: 'INTERNSHIP',
      level: 'INTERN',
      experienceYears: 0,
      skills: [],
    },
  });

  // Префилл при редактировании.
  useEffect(() => {
    if (existing && isEdit) {
      form.reset({
        title: existing.title,
        description: existing.description,
        responsibilities: existing.responsibilities,
        requirements: existing.requirements,
        conditions: existing.conditions,
        city: existing.city ?? '',
        workFormat: existing.workFormat,
        employmentType: existing.employmentType,
        level: existing.level,
        experienceYears: existing.experienceYears,
        salaryMin: existing.salaryMin ?? undefined,
        salaryMax: existing.salaryMax ?? undefined,
        skills: existing.skills.map((s) => ({
          skillId: s.skill.id,
          required: s.required,
          weight: s.weight,
        })),
      });
    }
  }, [existing, isEdit, form]);

  const onSubmit = async (values: VacancyFormValues) => {
    try {
      if (isEdit && id) {
        await update.mutateAsync({ id, data: values });
        toast.success('Вакансия обновлена');
      } else {
        await create.mutateAsync(values);
        toast.success('Вакансия опубликована');
      }
      navigate('/app/company/vacancies');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не удалось сохранить вакансию'));
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => navigate('/app/company/vacancies')}
      >
        <ArrowLeft className="size-4" />
        К вакансиям
      </Button>

      <h1 className="text-2xl font-bold tracking-tight">
        {isEdit ? 'Редактирование вакансии' : 'Новая вакансия'}
      </h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Основное</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Название вакансии</Label>
              <Input placeholder="Frontend-разработчик (React + TypeScript)" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Textarea
                className="min-h-[120px]"
                placeholder="Расскажите о роли, команде и продукте…"
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField control={form.control} name="workFormat" label="Формат" options={WORK_FORMAT_OPTIONS} />
              <SelectField
                control={form.control}
                name="employmentType"
                label="Занятость"
                options={EMPLOYMENT_OPTIONS}
              />
              <SelectField control={form.control} name="level" label="Уровень" options={SENIORITY_OPTIONS} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Город</Label>
                <Input placeholder="Москва" {...form.register('city')} />
              </div>
              <div className="space-y-1.5">
                <Label>Опыт (лет)</Label>
                <Input type="number" step={0.5} min={0} {...form.register('experienceYears')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>З/п от</Label>
                  <Input type="number" min={0} {...form.register('salaryMin')} />
                </div>
                <div className="space-y-1.5">
                  <Label>до</Label>
                  <Input type="number" min={0} {...form.register('salaryMax')} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Требуемые навыки</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="skills"
              render={({ field }) => (
                <SkillsPicker value={field.value} onChange={field.onChange} />
              )}
            />
            {form.formState.errors.skills && (
              <p className="mt-2 text-xs text-destructive">{form.formState.errors.skills.message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Детали</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Controller
              control={form.control}
              name="responsibilities"
              render={({ field }) => (
                <StringListInput label="Обязанности" value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <StringListInput label="Требования" value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <StringListInput label="Условия" value={field.value} onChange={field.onChange} />
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate('/app/company/vacancies')}>
            Отмена
          </Button>
          <Button type="submit" variant="gradient" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? 'Сохранить' : 'Опубликовать'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function SelectField({
  control,
  name,
  label,
  options,
}: {
  control: any;
  name: any;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function StringListInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const text = draft.trim();
    if (text) onChange([...value, text]);
    setDraft('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Добавьте пункт и нажмите Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button type="button" variant="outline" size="icon" onClick={add}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SkillsPicker({
  value,
  onChange,
}: {
  value: VacancyFormValues['skills'];
  onChange: (value: VacancyFormValues['skills']) => void;
}) {
  const { data: catalog } = useSkillCatalog();
  const byId = useMemo(
    () => new Map((catalog ?? []).map((s) => [s.id, s])),
    [catalog],
  );

  const grouped = useMemo(() => {
    const map = new Map<SkillCategory, Skill[]>();
    for (const skill of catalog ?? []) {
      const list = map.get(skill.category) ?? [];
      list.push(skill);
      map.set(skill.category, list);
    }
    return map;
  }, [catalog]);

  const toggle = (skillId: string) => {
    const exists = value.some((s) => s.skillId === skillId);
    onChange(
      exists
        ? value.filter((s) => s.skillId !== skillId)
        : [...value, { skillId, required: true, weight: 1 }],
    );
  };

  const patch = (skillId: string, p: Partial<VacancyFormValues['skills'][number]>) =>
    onChange(value.map((s) => (s.skillId === skillId ? { ...s, ...p } : s)));

  return (
    <div className="space-y-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline">
            <Plus className="size-4" />
            Добавить навык
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <ScrollArea className="h-72">
            <div className="p-2">
              {[...grouped.entries()].map(([category, list]) => (
                <div key={category} className="mb-2">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[category]}
                  </p>
                  {list.map((skill) => {
                    const active = value.some((s) => s.skillId === skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggle(skill.id)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                          active && 'text-primary',
                        )}
                      >
                        {skill.name}
                        {active && <Check className="size-4" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item) => (
            <div
              key={item.skillId}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span className="flex-1 text-sm font-medium">
                {byId.get(item.skillId)?.name ?? 'Навык'}
              </span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Обязательный
                <Switch
                  checked={item.required}
                  onCheckedChange={(checked) => patch(item.skillId, { required: checked })}
                />
              </label>
              <button
                type="button"
                onClick={() => toggle(item.skillId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
