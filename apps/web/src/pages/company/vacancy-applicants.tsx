import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Inbox, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useApplicants } from '@/hooks/use-companies';
import { useUpdateApplicationStatus } from '@/hooks/use-applications';
import { useStartConversation } from '@/hooks/use-conversations';
import { useVacancy } from '@/hooks/use-vacancies';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { MatchRing } from '@/components/match/match-ring';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { APPLICATION_STATUS_META, SENIORITY_LABELS } from '@/lib/constants';
import { initials } from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types/api';

const STATUS_OPTIONS: ApplicationStatus[] = ['PENDING', 'INVITED', 'OFFER', 'REJECTED'];

export function VacancyApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: vacancy } = useVacancy(id);
  const { data: applicants, isLoading } = useApplicants(id);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => navigate('/app/company/vacancies')}
      >
        <ArrowLeft className="size-4" />
        К вакансиям
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Отклики</h1>
        {vacancy && <p className="mt-1 text-muted-foreground">{vacancy.title}</p>}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : applicants && applicants.length > 0 ? (
        <div className="space-y-4">
          {applicants.map((application) => (
            <ApplicantCard key={application.id} application={application} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title="Пока нет откликов"
          description="Как только студенты откликнутся, они появятся здесь — отсортированные по match-score."
        />
      )}
    </div>
  );
}

function ApplicantCard({ application }: { application: Application }) {
  const student = application.student;
  const updateStatus = useUpdateApplicationStatus();
  const startConversation = useStartConversation();
  const navigate = useNavigate();

  if (!student) return null;

  const changeStatus = async (status: ApplicationStatus) => {
    try {
      await updateStatus.mutateAsync({ id: application.id, status });
      toast.success(`Статус изменён: ${APPLICATION_STATUS_META[status].label}`);
    } catch {
      toast.error('Не удалось изменить статус');
    }
  };

  const message = async () => {
    try {
      await startConversation.mutateAsync({ studentId: student.id });
      toast.success('Диалог открыт');
      navigate('/app/messages');
    } catch {
      toast.error('Не удалось открыть диалог');
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
        <MatchRing score={application.matchScore} size={64} strokeWidth={6} showLabel={false} />

        <div className="min-w-0 flex-1">
          <Link
            to={`/app/candidates/${student.id}`}
            className="font-semibold hover:text-primary"
          >
            {student.fullName}
          </Link>
          {student.headline && (
            <p className="text-sm text-muted-foreground">{student.headline}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {student.level && <Badge variant="secondary">{SENIORITY_LABELS[student.level]}</Badge>}
            {student.university && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="size-3.5" />
                {student.university}
              </span>
            )}
            {typeof student._count?.projects === 'number' && (
              <span>{student._count.projects} проектов</span>
            )}
          </div>
          {application.coverLetter && (
            <p className="mt-2 line-clamp-2 rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
              {application.coverLetter}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Select value={application.status} onValueChange={(v) => changeStatus(v as ApplicationStatus)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {APPLICATION_STATUS_META[status].emoji} {APPLICATION_STATUS_META[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={message} aria-label="Написать">
            <MessageSquare className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
