import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { useVacancies, type VacancyFilters as Filters } from '@/hooks/use-vacancies';
import { VacancyCard } from '@/components/vacancy/vacancy-card';
import { VacancyFilters } from '@/components/vacancy/vacancy-filters';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pluralWithCount } from '@/lib/format';

const INITIAL: Filters = { page: 1, limit: 12, sort: 'recent' };

export function VacanciesPage() {
  const [filters, setFilters] = useState<Filters>(INITIAL);
  const [searchTerm, setSearchTerm] = useState('');

  // Дебаунс поискового запроса.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchTerm || undefined, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useVacancies(filters);

  const patch = (p: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...p }));
  const reset = () => {
    setFilters(INITIAL);
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Поиск вакансий"
        description="Глубокий фильтр по технологиям: находите вакансии под ваш точный стек."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Должность, технология, компания…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={filters.sort ?? 'recent'}
            onValueChange={(v) => patch({ sort: v as Filters['sort'], page: 1 })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Сначала новые</SelectItem>
              <SelectItem value="salary">По зарплате</SelectItem>
            </SelectContent>
          </Select>

          {/* Мобильные фильтры */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="size-4" />
                Фильтры
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Фильтры</DialogTitle>
              </DialogHeader>
              <VacancyFilters filters={filters} onChange={patch} onReset={reset} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <VacancyFilters filters={filters} onChange={patch} onReset={reset} />
          </div>
        </aside>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {data ? pluralWithCount(data.total, ['вакансия', 'вакансии', 'вакансий']) : 'Загрузка…'}
            {isFetching && !isLoading && ' · обновление…'}
          </p>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((vacancy) => (
                  <VacancyCard key={vacancy.id} vacancy={vacancy} />
                ))}
              </div>
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={filters.page === 1}
                    onClick={() => patch({ page: (filters.page ?? 1) - 1 })}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {data.page} из {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={data.page >= data.totalPages}
                    onClick={() => patch({ page: (filters.page ?? 1) + 1 })}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Search}
              title="Ничего не найдено"
              description="Попробуйте изменить фильтры или поисковый запрос."
              action={
                <Button variant="outline" onClick={reset}>
                  Сбросить фильтры
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
