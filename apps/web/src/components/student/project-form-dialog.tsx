import { useState, type KeyboardEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAddProject } from '@/hooks/use-students';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { projectSchema, type ProjectValues } from '@/lib/schemas';
import { getApiErrorMessage } from '@/lib/api';

export function ProjectFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const add = useAddProject();
  const [techInput, setTechInput] = useState('');

  const form = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: '', description: '', technologies: [], role: '', url: '', githubUrl: '' },
  });

  const onSubmit = async (values: ProjectValues) => {
    try {
      await add.mutateAsync(values);
      toast.success('Проект добавлен');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не удалось добавить проект'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый проект</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Название</Label>
            <Input placeholder="Трекер задач" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Описание</Label>
            <Textarea placeholder="Что делает проект, ваша роль, результат…" {...form.register('description')} />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <Controller
            control={form.control}
            name="technologies"
            render={({ field }) => {
              const addTech = () => {
                const value = techInput.trim().replace(/,$/, '');
                if (value && !field.value.includes(value)) {
                  field.onChange([...field.value, value]);
                }
                setTechInput('');
              };
              const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTech();
                }
              };
              return (
                <div className="space-y-1.5">
                  <Label>Технологии</Label>
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {field.value.map((tech) => (
                        <button
                          type="button"
                          key={tech}
                          onClick={() => field.onChange(field.value.filter((t) => t !== tech))}
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                        >
                          {tech}
                          <X className="size-3" />
                        </button>
                      ))}
                    </div>
                  )}
                  <Input
                    placeholder="React, TypeScript… (Enter для добавления)"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={addTech}
                  />
                  {form.formState.errors.technologies && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.technologies.message}
                    </p>
                  )}
                </div>
              );
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Demo-ссылка</Label>
              <Input placeholder="https://…" {...form.register('url')} />
            </div>
            <div className="space-y-1.5">
              <Label>Репозиторий</Label>
              <Input placeholder="https://github.com/…" {...form.register('githubUrl')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="gradient" disabled={add.isPending}>
              {add.isPending && <Loader2 className="size-4 animate-spin" />}
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
