import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Github, GraduationCap, MapPin, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useCandidate } from '@/hooks/use-students';
import { useStartConversation } from '@/hooks/use-conversations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CATEGORY_LABELS, SENIORITY_LABELS } from '@/lib/constants';
import { initials } from '@/lib/utils';

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: candidate, isLoading } = useCandidate(id);
  const startConversation = useStartConversation();
  const navigate = useNavigate();

  if (isLoading || !candidate) return <Skeleton className="h-96 rounded-2xl" />;

  const message = async () => {
    try {
      await startConversation.mutateAsync({ studentId: candidate.id });
      toast.success('Диалог открыт');
      navigate('/app/messages');
    } catch {
      toast.error('Не удалось открыть диалог');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link to="/app/candidates">
          <ArrowLeft className="size-4" />
          К кандидатам
        </Link>
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar className="size-20 rounded-2xl">
              {candidate.avatarUrl && <AvatarImage src={candidate.avatarUrl} alt={candidate.fullName} />}
              <AvatarFallback className="rounded-2xl text-xl">
                {initials(candidate.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{candidate.fullName}</h1>
              {candidate.headline && <p className="mt-1 text-muted-foreground">{candidate.headline}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <Badge variant="secondary">{SENIORITY_LABELS[candidate.level]}</Badge>
                {candidate.specialization && (
                  <Badge variant="muted">{CATEGORY_LABELS[candidate.specialization]}</Badge>
                )}
                {candidate.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {candidate.city}
                  </span>
                )}
                {candidate.university && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="size-3.5" />
                    {candidate.university}
                  </span>
                )}
              </div>
              {candidate.githubUrl && (
                <a
                  href={candidate.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Github className="size-4" />
                  GitHub
                </a>
              )}
            </div>
            <Button variant="gradient" onClick={message} disabled={startConversation.isPending}>
              <MessageSquare className="size-4" />
              Написать
            </Button>
          </div>

          {candidate.bio && (
            <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
              {candidate.bio}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Навыки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {candidate.skills.length > 0 ? (
            candidate.skills.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{s.skill.name}</span>
                  <span className="text-muted-foreground">{s.progress}%</span>
                </div>
                <Progress value={s.progress} className="h-1.5" />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Навыки не указаны.</p>
          )}
        </CardContent>
      </Card>

      {candidate.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Проекты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidate.projects.map((project) => (
              <div key={project.id} className="rounded-xl border border-border p-4">
                <h3 className="font-semibold">{project.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-medium text-accent-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                {(project.githubUrl || project.url) && (
                  <div className="mt-2 flex gap-3 text-sm">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Github className="size-3.5" /> Код
                      </a>
                    )}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="size-3.5" /> Demo
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
