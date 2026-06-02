import { Check, Plug, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePassport } from '@/hooks/use-skillproof';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PassportCard } from '@/components/skillproof/passport-card';
import { IntegrationsPanel } from '@/components/skillproof/integrations-panel';
import { CATEGORY_LABELS } from '@/lib/constants';

export function PassportPage() {
  const { data: passport, isLoading } = usePassport();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (!passport) return;
    const spec = passport.market?.specialization
      ? CATEGORY_LABELS[passport.market.specialization]
      : 'IT';
    const summary = [
      `${passport.student.fullName} — Skill Proof Passport (TechIntern)`,
      `Skill Score: ${passport.skillScore} · Лига: ${passport.leagueLabel}`,
      `Серия: ${passport.streak.current} дн. · Регулярность: ${Math.round(passport.streak.consistency30 * 100)}%`,
      passport.market ? `Рынок: топ-${passport.market.topPercent}% в направлении ${spec}` : '',
      `Доказано: GitHub ${passport.stats.githubCommits} коммитов, Codewars ${passport.stats.codewarsSolved} задач`,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success('Паспорт скопирован — вставьте в письмо или сообщение');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SkillProof"
        title="Skill Proof Passport"
        description="Ваш живой верифицированный паспорт навыков. Прикрепляйте его к откликам — работодатель видит не «3 проекта», а реальную дисциплину и активность."
        actions={
          <Button variant="gradient" onClick={share} disabled={!passport}>
            {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
            Поделиться
          </Button>
        }
      />

      {isLoading || !passport ? (
        <Skeleton className="h-[600px] rounded-2xl" />
      ) : (
        <div className="mx-auto max-w-3xl">
          <PassportCard passport={passport} />
        </div>
      )}

      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="size-5 text-primary" />
            Источники доказательств
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Подключите аккаунты — система автоматически подтянет вашу активность и пополнит паспорт и Skill Tree.
          </p>
          <IntegrationsPanel />
        </CardContent>
      </Card>
    </div>
  );
}
