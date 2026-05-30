import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Send } from 'lucide-react';
import { useMyApplications } from '@/hooks/use-applications';
import { ApplicationCard } from '@/components/application/application-card';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ApplicationStatus } from '@/types/api';

type Filter = 'ALL' | ApplicationStatus;

const TABS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Все' },
  { value: 'PENDING', label: 'На рассмотрении' },
  { value: 'INVITED', label: 'Приглашения' },
  { value: 'OFFER', label: 'Офферы' },
  { value: 'REJECTED', label: 'Отказы' },
];

export function ApplicationsPage() {
  const { data, isLoading } = useMyApplications();
  const [filter, setFilter] = useState<Filter>('ALL');

  const filtered = data?.filter((a) => filter === 'ALL' || a.status === filter) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Мои отклики"
        description="Отслеживайте каждый отклик: ⏳ На рассмотрении → ✅ Приглашение → 🎯 Оффер."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Send}
          title={data?.length ? 'Нет откликов в этой категории' : 'Вы ещё не откликались'}
          description="Найдите подходящую вакансию и отправьте первый отклик."
          action={
            <Button asChild variant="gradient">
              <Link to="/app/vacancies">
                <Search className="size-4" />
                К поиску вакансий
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
