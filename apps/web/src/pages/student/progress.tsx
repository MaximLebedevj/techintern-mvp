import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, Flame, IdCard, Trophy } from 'lucide-react';
import { usePassport, useActivity, useBadgeCatalog } from '@/hooks/use-skillproof';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SkillScoreRing } from '@/components/skillproof/skill-score-ring';
import { ActivityHeatmap } from '@/components/skillproof/activity-heatmap';
import { BadgeGrid } from '@/components/skillproof/badge-grid';
import { formatRelative } from '@/lib/format';

export function ProgressPage() {
  const { data: passport, isLoading } = usePassport();
  const { data: activity } = useActivity(140);
  const { data: catalog } = useBadgeCatalog();

  if (isLoading || !passport) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const earnedKeys = new Set(passport.badges.map((b) => b.key));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SkillProof"
        title="Мой прогресс"
        description="Живой Skill Score, серии активности и достижения — обновляются автоматически из ваших действий."
        actions={
          <Button asChild variant="gradient">
            <Link to="/app/passport">
              <IdCard className="size-4" />
              Открыть паспорт
            </Link>
          </Button>
        }
      />

      {passport.streak.withering && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-foreground">Ваши навыки начинают увядать 🍂</p>
            <p className="text-muted-foreground">
              Уже {passport.streak.daysSinceActive} дней без активности. Сделайте коммит или решите задачу,
              чтобы оживить дерево навыков и не потерять серию.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skill Score + лига */}
        <Card>
          <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
            <SkillScoreRing score={passport.skillScore} league={passport.league} size={150} />
            <div className="w-full space-y-3">
              {passport.nextLeague ? (
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">До {passport.nextLeague.league}</span>
                    <span className="font-semibold text-primary">+{passport.nextLeague.pointsTo}</span>
                  </div>
                  <Progress value={(passport.skillScore % 200) / 2} className="h-2" />
                </div>
              ) : (
                <p className="text-sm font-medium text-violet-500">Высшая лига — Алмаз! 💎</p>
              )}
              <Bar label="Дисциплина" value={passport.scoreBreakdown.streak} max={400} />
              <Bar label="Объём работы" value={passport.scoreBreakdown.volume} max={300} />
              <Bar label="Признание" value={passport.scoreBreakdown.social} max={300} />
            </div>
          </CardContent>
        </Card>

        {/* Серия */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-5 text-orange-500" />
              Серия активности
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-6">
              <div>
                <p className="font-display text-5xl font-extrabold leading-none text-orange-500">
                  {passport.streak.current}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">дней подряд</p>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 text-sm">
                <Stat label="Рекорд" value={`${passport.streak.longest} дн.`} />
                <Stat label="Регулярность" value={`${Math.round(passport.streak.consistency30 * 100)}%`} />
                <Stat label="Активных / 90 дн." value={`${passport.stats.activeDays90}`} />
                <Stat label="Рынок" value={passport.market ? `топ-${passport.market.topPercent}%` : '—'} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            Календарь активности
          </CardTitle>
        </CardHeader>
        <CardContent>{activity ? <ActivityHeatmap data={activity} /> : <Skeleton className="h-24" />}</CardContent>
      </Card>

      {/* Достижения */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-warning" />
            Достижения ({earnedKeys.size} / {catalog?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {catalog ? <BadgeGrid badges={catalog} earnedKeys={earnedKeys} /> : <Skeleton className="h-24" />}
        </CardContent>
      </Card>

      {/* Недавняя активность */}
      {passport.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Недавняя активность</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {passport.recentActivity.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="truncate">{item.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(item.occurredAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <Progress value={(value / max) * 100} className="h-1.5" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-2.5">
      <p className="text-base font-bold leading-none">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
