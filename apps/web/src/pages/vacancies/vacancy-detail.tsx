import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useVacancy, useApplyToVacancy } from '@/hooks/use-vacancies';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MatchDetails } from '@/components/match/match-details';
import { EMPLOYMENT_LABELS, SENIORITY_LABELS, WORK_FORMAT_LABELS, APPLICATION_STATUS_META } from '@/lib/constants';
import { formatSalary } from '@/lib/format';
import { getApiErrorMessage } from '@/lib/api';
import { initials } from '@/lib/utils';

export function VacancyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isStudent } = useAuth();
  const { data: vacancy, isLoading } = useVacancy(id);

  if (isLoading || !vacancy) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link to="/app/vacancies">
          <ArrowLeft className="size-4" />
          К поиску
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="size-14 rounded-2xl">
                  {vacancy.company.logoUrl && (
                    <AvatarImage src={vacancy.company.logoUrl} alt={vacancy.company.name} />
                  )}
                  <AvatarFallback className="rounded-2xl">
                    {initials(vacancy.company.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{vacancy.title}</h1>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="size-4" />
                    {vacancy.company.name}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="secondary">{SENIORITY_LABELS[vacancy.level]}</Badge>
                <Badge variant="secondary">{WORK_FORMAT_LABELS[vacancy.workFormat]}</Badge>
                <Badge variant="muted">{EMPLOYMENT_LABELS[vacancy.employmentType]}</Badge>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Banknote className="size-4 text-muted-foreground" />
                  {formatSalary(vacancy.salaryMin, vacancy.salaryMax)}
                </span>
                {vacancy.city && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-4" />
                    {vacancy.city}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Briefcase className="size-4" />
                  Опыт: {vacancy.experienceYears > 0 ? `${vacancy.experienceYears} г.` : 'не требуется'}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {vacancy.skills.map((vs) => (
                  <span
                    key={vs.id}
                    className="rounded-md bg-accent/60 px-2.5 py-1 text-xs font-medium text-accent-foreground"
                  >
                    {vs.skill.name}
                    {!vs.required && ' (желательно)'}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-6 p-6">
              <Section title="О вакансии">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {vacancy.description}
                </p>
              </Section>
              {vacancy.responsibilities.length > 0 && (
                <BulletSection title="Обязанности" items={vacancy.responsibilities} />
              )}
              {vacancy.requirements.length > 0 && (
                <BulletSection title="Требования" items={vacancy.requirements} />
              )}
              {vacancy.conditions.length > 0 && (
                <BulletSection title="Условия" items={vacancy.conditions} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Сайдбар: отклик + AI-match */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {isStudent ? (
            <Card>
              <CardHeader>
                <CardTitle>Ваш отклик</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {vacancy.application ? (
                  <div className="flex items-center gap-2 rounded-xl bg-accent p-3 text-sm">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span>
                      Вы откликнулись · {APPLICATION_STATUS_META[vacancy.application.status].label}
                    </span>
                  </div>
                ) : (
                  <ApplyDialog vacancyId={vacancy.id} vacancyTitle={vacancy.title} />
                )}
                {vacancy.match && <MatchDetails match={vacancy.match} />}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Войдите как студент, чтобы увидеть персональный match-score и откликнуться.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Section title={title}>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ApplyDialog({ vacancyId, vacancyTitle }: { vacancyId: string; vacancyTitle: string }) {
  const [open, setOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const apply = useApplyToVacancy();

  const submit = async () => {
    try {
      await apply.mutateAsync({ vacancyId, coverLetter: coverLetter || undefined });
      toast.success('Отклик отправлен! Следите за статусом в разделе «Мои отклики».');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не удалось отправить отклик'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="w-full">
          <Send className="size-4" />
          Откликнуться
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отклик на вакансию</DialogTitle>
          <DialogDescription>{vacancyTitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">Сопроводительное письмо (необязательно)</label>
          <Textarea
            placeholder="Расскажите, почему вы отлично подходите…"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            className="min-h-[140px]"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button variant="gradient" onClick={submit} disabled={apply.isPending}>
            {apply.isPending && <Loader2 className="size-4 animate-spin" />}
            Отправить отклик
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
