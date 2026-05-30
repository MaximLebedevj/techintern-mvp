import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  GaugeCircle,
  Plus,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMyApplications } from '@/hooks/use-applications';
import { useRecommendations, useSkillTree } from '@/hooks/use-students';
import { useCareerProgress } from '@/hooks/use-career-hub';
import { useCompanyStats, useMyVacancies } from '@/hooks/use-companies';
import { StatCard } from '@/components/common/stat-card';
import { VacancyCard } from '@/components/vacancy/vacancy-card';
import { ApplicationCard } from '@/components/application/application-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { APPLICATION_STATUS_META } from '@/lib/constants';
import { formatNumber } from '@/lib/format';

export function DashboardPage() {
  const { isStudent } = useAuth();
  return isStudent ? <StudentDashboard /> : <CompanyDashboard />;
}

// --- Студент ----------------------------------------------------------------

function StudentDashboard() {
  const { user } = useAuth();
  const { data: tree } = useSkillTree();
  const { data: applications } = useMyApplications();
  const { data: progress } = useCareerProgress(true);
  const { data: recommendations } = useRecommendations();

  const name = user?.student?.fullName?.split(' ')[0] ?? 'студент';
  const avgSkill = tree?.categories.length
    ? Math.round(tree.categories.reduce((s, c) => s + c.progress, 0) / tree.categories.length)
    : 0;
  const offers = applications?.filter((a) => a.status === 'OFFER').length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Привет, {name} 👋</h1>
        <p className="mt-1 text-muted-foreground">Вот ваш прогресс и подходящие вакансии.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={GaugeCircle} label="Средний прогресс навыков" value={`${avgSkill}%`} />
        <StatCard icon={Send} label="Активных откликов" value={applications?.length ?? 0} />
        <StatCard
          icon={Target}
          label="Офферов"
          value={offers}
          tone="success"
        />
        <StatCard
          icon={CheckCircle2}
          label="Пройдено материалов"
          value={`${progress?.completedCount ?? 0} / ${progress?.totalCount ?? 0}`}
          tone="warning"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Рекомендуем вам</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/vacancies">
              Все вакансии <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {recommendations ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.vacancies.slice(0, 3).map((vacancy) => (
              <VacancyCard key={vacancy.id} vacancy={vacancy} />
            ))}
          </div>
        ) : (
          <SkeletonGrid />
        )}
      </section>

      {applications && applications.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Последние отклики</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/applications">
                Все отклики <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {applications.slice(0, 2).map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// --- Компания ---------------------------------------------------------------

function CompanyDashboard() {
  const { user } = useAuth();
  const { data: stats } = useCompanyStats();
  const { data: vacancies } = useMyVacancies();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {user?.company?.name ?? 'Дашборд'}
          </h1>
          <p className="mt-1 text-muted-foreground">Обзор вакансий и откликов.</p>
        </div>
        <Button asChild variant="gradient">
          <Link to="/app/company/vacancies/new">
            <Plus className="size-4" />
            Разместить вакансию
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Активных вакансий" value={stats?.activeVacancies ?? 0} />
        <StatCard
          icon={Users}
          label="Всего откликов"
          value={stats ? formatNumber(stats.totalApplications) : 0}
        />
        <StatCard
          icon={Sparkles}
          label="Средний match"
          value={`${stats?.avgMatch ?? 0}%`}
          tone="success"
        />
        <StatCard
          icon={TrendingUp}
          label="Конверсия в оффер"
          value={`${stats?.conversionToOffer ?? 0}%`}
          tone="warning"
        />
      </div>

      {stats && stats.totalApplications > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Воронка откликов</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {(Object.keys(stats.byStatus) as Array<keyof typeof stats.byStatus>).map((status) => {
              const meta = APPLICATION_STATUS_META[status];
              return (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2"
                >
                  <span className="text-lg">{meta.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold">{stats.byStatus[status]}</p>
                    <p className="text-xs text-muted-foreground">{meta.label}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Ваши вакансии</h2>
        {vacancies ? (
          vacancies.length > 0 ? (
            <div className="space-y-3">
              {vacancies.slice(0, 5).map((vacancy) => (
                <Link
                  key={vacancy.id}
                  to={`/app/company/vacancies/${vacancy.id}/applicants`}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
                >
                  <div>
                    <p className="font-semibold">{vacancy.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {vacancy._count?.applications ?? 0} откликов
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Пока нет вакансий. Разместите первую, чтобы начать получать отклики.
            </Card>
          )
        ) : (
          <SkeletonGrid />
        )}
      </section>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-52 rounded-2xl" />
      ))}
    </div>
  );
}
