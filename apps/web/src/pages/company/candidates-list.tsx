import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useCandidates, type CandidateFilters } from '@/hooks/use-students';
import { useMyVacancies } from '@/hooks/use-companies';
import { CandidateCard } from '@/components/candidate/candidate-card';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CATEGORY_OPTIONS } from '@/lib/constants';
import { pluralWithCount } from '@/lib/format';

const ALL = 'ALL';

export function CandidatesPage() {
  const { data: vacancies } = useMyVacancies();
  const [filters, setFilters] = useState<CandidateFilters>({ page: 1, limit: 12 });
  const [term, setTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setFilters((p) => ({ ...p, q: term || undefined, page: 1 })), 350);
    return () => clearTimeout(timer);
  }, [term]);

  const { data, isLoading } = useCandidates(filters);
  const patch = (p: Partial<CandidateFilters>) => setFilters((prev) => ({ ...prev, ...p }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Кандидаты"
        description="Выберите вакансию, чтобы ранжировать студентов по AI-match score."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Ранжировать под вакансию</Label>
          <Select
            value={filters.vacancyId ?? ALL}
            onValueChange={(v) => patch({ vacancyId: v === ALL ? undefined : v, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Без ранжирования" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Без ранжирования</SelectItem>
              {vacancies?.map((vacancy) => (
                <SelectItem key={vacancy.id} value={vacancy.id}>
                  {vacancy.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Направление</Label>
          <Select
            value={filters.specialization ?? ALL}
            onValueChange={(v) => patch({ specialization: v === ALL ? undefined : v, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Все</SelectItem>
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Поиск</Label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Имя, навык…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {data && (
        <p className="text-sm text-muted-foreground">
          {pluralWithCount(data.total, ['кандидат', 'кандидата', 'кандидатов'])}
          {filters.vacancyId && ' · отсортированы по совпадению'}
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(filters.page ?? 1) === 1}
                onClick={() => patch({ page: (filters.page ?? 1) - 1 })}
              >
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                {data.page} из {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => patch({ page: (filters.page ?? 1) + 1 })}
              >
                Вперёд
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={Users} title="Кандидаты не найдены" description="Измените фильтры поиска." />
      )}
    </div>
  );
}
