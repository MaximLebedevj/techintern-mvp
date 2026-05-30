import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useDeleteVacancy, useMyVacancies } from '@/hooks/use-companies';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SENIORITY_LABELS, WORK_FORMAT_LABELS } from '@/lib/constants';
import { formatSalary, pluralWithCount } from '@/lib/format';

export function CompanyVacanciesPage() {
  const { data: vacancies, isLoading } = useMyVacancies();
  const remove = useDeleteVacancy();
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить вакансию? Это действие необратимо.')) return;
    try {
      await remove.mutateAsync(id);
      toast.success('Вакансия удалена');
    } catch {
      toast.error('Не удалось удалить вакансию');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Мои вакансии"
        description="Управляйте вакансиями и смотрите отклики кандидатов."
        actions={
          <Button variant="gradient" onClick={() => navigate('/app/company/vacancies/new')}>
            <Plus className="size-4" />
            Разместить вакансию
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : vacancies && vacancies.length > 0 ? (
        <div className="space-y-3">
          {vacancies.map((vacancy) => (
            <Card key={vacancy.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/app/company/vacancies/${vacancy.id}/applicants`}
                      className="font-semibold hover:text-primary"
                    >
                      {vacancy.title}
                    </Link>
                    <Badge variant={vacancy.status === 'ACTIVE' ? 'success' : 'muted'}>
                      {vacancy.status === 'ACTIVE' ? 'Активна' : 'Закрыта'}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{SENIORITY_LABELS[vacancy.level]}</span>
                    <span>{WORK_FORMAT_LABELS[vacancy.workFormat]}</span>
                    <span>{formatSalary(vacancy.salaryMin, vacancy.salaryMax)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" />
                      {pluralWithCount(vacancy._count?.applications ?? 0, [
                        'отклик',
                        'отклика',
                        'откликов',
                      ])}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/app/company/vacancies/${vacancy.id}/applicants`}>
                      <Users className="size-4" />
                      Отклики
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon">
                    <Link to={`/app/company/vacancies/${vacancy.id}/edit`} aria-label="Редактировать">
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(vacancy.id)}
                    aria-label="Удалить"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="Пока нет вакансий"
          description="Разместите первую вакансию, чтобы начать получать отклики от студентов."
          action={
            <Button variant="gradient" onClick={() => navigate('/app/company/vacancies/new')}>
              <Plus className="size-4" />
              Разместить вакансию
            </Button>
          }
        />
      )}
    </div>
  );
}
