import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useCareerResource, useCareerProgress, useCompleteResource } from '@/hooks/use-career-hub';
import { useAuth } from '@/hooks/use-auth';
import { CodeReview } from '@/components/career/code-review';
import { Markdown } from '@/components/common/markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { plural } from '@/lib/format';
import { cn } from '@/lib/utils';

export function CareerResourcePage() {
  const { slug } = useParams<{ slug: string }>();
  const { isStudent } = useAuth();
  const { data: resource, isLoading } = useCareerResource(slug);
  const { data: progress } = useCareerProgress(isStudent);
  const complete = useCompleteResource();

  if (isLoading || !resource) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  const isCompleted = progress?.completedIds.includes(resource.id);

  const markCompleted = async () => {
    try {
      await complete.mutateAsync(resource.id);
      toast.success('Отмечено как пройденное 🎉');
    } catch {
      toast.error('Не удалось отметить материал');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link to="/app/career">
          <ArrowLeft className="size-4" />
          К Career Hub
        </Link>
      </Button>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">{resource.category}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {resource.readMinutes} {plural(resource.readMinutes, ['минута', 'минуты', 'минут'])}
          </span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{resource.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{resource.summary}</p>

        {resource.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {resource.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {resource.type === 'CODE_REVIEW' ? (
        <CodeReview resource={resource} />
      ) : resource.type === 'CHECKLIST' ? (
        <ChecklistView items={resource.checklistItems} note={resource.content} />
      ) : (
        <Card>
          <CardContent className="p-6">
            <Markdown content={resource.content} />
          </CardContent>
        </Card>
      )}

      {isStudent && (
        <div className="flex justify-center pt-2">
          <Button
            variant={isCompleted ? 'outline' : 'gradient'}
            onClick={markCompleted}
            disabled={complete.isPending || isCompleted}
          >
            <CheckCircle2 className="size-4" />
            {isCompleted ? 'Пройдено' : 'Отметить пройденным'}
          </Button>
        </div>
      )}
    </div>
  );
}

function ChecklistView({ items, note }: { items: string[]; note: string }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <Card>
      <CardContent className="space-y-2 p-6">
        {items.map((item, i) => {
          const done = checked.has(i);
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left text-sm transition-colors hover:bg-accent/40',
                done && 'bg-accent/40',
              )}
            >
              {done ? (
                <CheckCircle2 className="size-5 shrink-0 text-success" />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground" />
              )}
              <span className={cn(done && 'text-muted-foreground line-through')}>{item}</span>
            </button>
          );
        })}
        {note && <p className="pt-2 text-sm text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}
