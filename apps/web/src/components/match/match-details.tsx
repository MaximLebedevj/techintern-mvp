import { ArrowUpRight, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import { MatchRing } from './match-ring';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { MatchResult } from '@/types/api';

/** Объяснимый AI-разбор совпадения (см. доклад §4.1 «AI-скоринг»). */
export function MatchDetails({ match }: { match: MatchResult }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5">
        <MatchRing score={match.score} size={108} />
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" />
            AI-оценка совпадения
          </div>
          <p className="text-sm text-muted-foreground">
            Алгоритм сравнивает ваш профиль с требованиями вакансии (TF-IDF + косинусная близость).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Breakdown label="Навыки" value={match.breakdown.skills} />
        <Breakdown label="Текст" value={match.breakdown.text} />
        <Breakdown label="Уровень" value={match.breakdown.level} />
      </div>

      {match.matchedSkills.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Совпадающие навыки
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.matchedSkills.map((skill) => (
              <Badge key={skill.name} variant="success">
                <CheckCircle2 className="size-3" />
                {skill.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {match.missingSkills.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Что добавит баллов
          </p>
          <div className="space-y-1.5">
            {match.missingSkills.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <span className="font-medium">{skill.name}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <TrendingUp className="size-3.5" />+{skill.potentialGain}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {match.explanation.length > 0 && (
        <ul className="space-y-1.5 rounded-xl bg-accent/40 p-4 text-sm">
          {match.explanation.map((line, i) => (
            <li key={i} className="flex gap-2 text-foreground">
              <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Breakdown({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold">{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}
