import {
  Flame,
  Github,
  Sparkles,
  Swords,
  TrendingUp,
  Verified,
} from 'lucide-react';
import type { SkillPassport } from '@/types/skillproof';
import { CATEGORY_LABELS, SENIORITY_LABELS } from '@/lib/constants';
import { formatRelative } from '@/lib/format';
import { initials, cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { SkillScoreRing } from './skill-score-ring';
import { LeagueBadge } from './league-badge';
import { BadgeGrid } from './badge-grid';

/**
 * Skill Proof Passport — богатая верифицированная карточка кандидата.
 * Используется на странице паспорта студента и при просмотре кандидата компанией.
 */
export function PassportCard({ passport }: { passport: SkillPassport }) {
  const { student, streak, market, stats, scoreBreakdown } = passport;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* Шапка с фирменным свечением */}
      <div className="relative overflow-hidden bg-[hsl(245_55%_12%)] p-6 text-white">
        <div className="glow-spot left-0 top-0 size-64 bg-brand-500" />
        <div className="glow-spot bottom-0 right-0 size-56 bg-fuchsia-500" />
        <div className="relative flex flex-wrap items-center gap-4">
          <Avatar className="size-16 rounded-2xl ring-2 ring-white/20">
            {student.avatarUrl && <AvatarImage src={student.avatarUrl} alt={student.fullName} />}
            <AvatarFallback className="rounded-2xl text-lg">{initials(student.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{student.fullName}</h2>
              <Verified className="size-4 text-brand-300" />
            </div>
            {student.headline && <p className="text-sm text-white/70">{student.headline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <LeagueBadge league={passport.league} />
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
                {SENIORITY_LABELS[student.level]}
              </span>
              {student.specialization && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
                  {CATEGORY_LABELS[student.specialization]}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
            <Sparkles className="size-3.5 text-brand-300" />
            Skill Proof Passport
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Счёт + ключевые метрики */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <SkillScoreRing score={passport.skillScore} league={passport.league} />
          <div className="grid flex-1 grid-cols-2 gap-3">
            <Metric icon={Flame} tone="text-orange-500" label="Серия" value={`${streak.current} дн.`} hint={`рекорд ${streak.longest}`} />
            <Metric icon={TrendingUp} tone="text-success" label="Регулярность" value={`${Math.round(streak.consistency30 * 100)}%`} hint="за 30 дней" />
            <Metric
              icon={Verified}
              tone="text-primary"
              label="Рынок"
              value={market ? `топ-${market.topPercent}%` : '—'}
              hint={market?.specialization ? CATEGORY_LABELS[market.specialization] : 'направление'}
            />
            <Metric icon={Sparkles} tone="text-fuchsia-500" label="Активных дней" value={`${stats.activeDays90}`} hint="за 90 дней" />
          </div>
        </div>

        {passport.nextLeague && (
          <p className="rounded-lg bg-accent/40 px-3 py-2 text-center text-sm">
            До лиги <span className="font-semibold">{passport.nextLeague.league}</span> осталось{' '}
            <span className="font-semibold text-primary">{passport.nextLeague.pointsTo}</span> очков
          </p>
        )}

        {/* Разбивка Skill Score */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Из чего собран Skill Score
          </p>
          <ScoreBar label="Дисциплина (серии)" value={scoreBreakdown.streak} max={400} />
          <ScoreBar label="Объём работы" value={scoreBreakdown.volume} max={300} />
          <ScoreBar label="Признание" value={scoreBreakdown.social} max={300} />
        </div>

        {/* Доказанные технологии */}
        {passport.provenTech.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Доказанные технологии
            </p>
            <div className="flex flex-wrap gap-1.5">
              {passport.provenTech.map((tech) => (
                <span
                  key={tech.name}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                    tech.verified
                      ? 'bg-success/12 text-success'
                      : 'bg-accent/60 text-accent-foreground',
                  )}
                >
                  {tech.verified && <Verified className="size-3" />}
                  {tech.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Верифицированные источники */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SourceStat icon={Github} label="Коммиты" value={stats.githubCommits} />
          <SourceStat icon={Sparkles} label="Звёзды GitHub" value={stats.githubStars} />
          <SourceStat icon={Swords} label="Задачи Codewars" value={stats.codewarsSolved} />
        </div>

        {/* Бейджи */}
        {passport.badges.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Достижения
            </p>
            <BadgeGrid badges={passport.badges} />
          </div>
        )}

        {/* Недавняя активность */}
        {passport.recentActivity.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Недавняя активность
            </p>
            <ul className="space-y-1.5">
              {passport.recentActivity.slice(0, 6).map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{item.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelative(item.occurredAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: typeof Flame;
  tone: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-3">
      <div className="flex items-center gap-1.5">
        <Icon className={cn('size-4', tone)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold leading-none">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          {value} / {max}
        </span>
      </div>
      <Progress value={(value / max) * 100} className="h-1.5" />
    </div>
  );
}

function SourceStat({ icon: Icon, label, value }: { icon: typeof Github; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <p className="text-sm font-bold leading-none tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
