import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { useCareerProgress, useCareerResources } from '@/hooks/use-career-hub';
import { useAuth } from '@/hooks/use-auth';
import { ResourceCard } from '@/components/career/resource-card';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ResourceType } from '@/types/api';

type TypeFilter = 'ALL' | ResourceType;

const TABS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Все' },
  { value: 'GUIDE', label: 'Гайды' },
  { value: 'CHECKLIST', label: 'Чеклисты' },
  { value: 'CODE_REVIEW', label: 'Разборы кода' },
];

export function CareerHubPage() {
  const { isStudent } = useAuth();
  const [type, setType] = useState<TypeFilter>('ALL');
  const [q, setQ] = useState('');

  const { data: resources, isLoading } = useCareerResources({
    type: type === 'ALL' ? undefined : type,
    q: q || undefined,
  });
  const { data: progress } = useCareerProgress(isStudent);
  const completedIds = new Set(progress?.completedIds ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Career Hub"
        title="Подготовка к собеседованиям"
        description="Гайды, чеклисты и интерактивные разборы кода — всё, чтобы пройти интервью увереннее."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={type} onValueChange={(v) => setType(v as TypeFilter)}>
          <TabsList className="flex-wrap">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative sm:w-64">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск материалов…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : resources && resources.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              completed={completedIds.has(resource.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={BookOpen} title="Материалы не найдены" description="Измените фильтр или запрос." />
      )}
    </div>
  );
}
