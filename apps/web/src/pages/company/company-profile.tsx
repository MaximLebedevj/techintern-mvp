import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMyCompany, useUpdateCompany } from '@/hooks/use-companies';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COMPANY_SIZE_LABELS } from '@/lib/constants';
import { companyProfileSchema, type CompanyProfileValues } from '@/lib/schemas';
import { getApiErrorMessage } from '@/lib/api';
import type { CompanySize } from '@/types/api';

const SIZE_OPTIONS = Object.entries(COMPANY_SIZE_LABELS).map(([value, label]) => ({
  value: value as CompanySize,
  label,
}));

export function CompanyProfilePage() {
  const { data: company, isLoading } = useMyCompany();
  const update = useUpdateCompany();

  const form = useForm<CompanyProfileValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: { name: '', description: '', website: '', city: '', industry: '', size: 'STARTUP' },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        description: company.description ?? '',
        website: company.website ?? '',
        city: company.city ?? '',
        industry: company.industry ?? '',
        size: company.size,
      });
    }
  }, [company, form]);

  const onSubmit = async (values: CompanyProfileValues) => {
    try {
      await update.mutateAsync(values);
      toast.success('Профиль компании обновлён');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не удалось сохранить'));
    }
  };

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Профиль компании" description="Эти данные видят кандидаты в вакансиях." />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Сфера</Label>
                <Input placeholder="SaaS, Fintech…" {...form.register('industry')} />
              </div>
              <div className="space-y-1.5">
                <Label>Город</Label>
                <Input placeholder="Москва" {...form.register('city')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Размер компании</Label>
                <Controller
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Сайт</Label>
                <Input placeholder="https://…" {...form.register('website')} />
                {form.formState.errors.website && (
                  <p className="text-xs text-destructive">{form.formState.errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>О компании</Label>
              <Textarea
                className="min-h-[120px]"
                placeholder="Чем занимается компания, культура, что предлагаете стажёрам…"
                {...form.register('description')}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="gradient" disabled={update.isPending}>
                {update.isPending && <Loader2 className="size-4 animate-spin" />}
                Сохранить
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
