import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Clock, Code2, ListChecks } from 'lucide-react';
import type { CareerResource, ResourceType } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { plural } from '@/lib/format';

const TYPE_META: Record<ResourceType, { label: string; icon: typeof BookOpen }> = {
  GUIDE: { label: 'Гайд', icon: BookOpen },
  CHECKLIST: { label: 'Чеклист', icon: ListChecks },
  CODE_REVIEW: { label: 'Разбор кода', icon: Code2 },
};

export function ResourceCard({
  resource,
  completed,
}: {
  resource: CareerResource;
  completed?: boolean;
}) {
  const meta = TYPE_META[resource.type];
  const Icon = meta.icon;

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="h-full">
      <Link
        to={`/app/career/${resource.slug}`}
        className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:border-primary/30 hover:shadow-card-hover"
      >
        <div className="flex items-start justify-between">
          <div className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </div>
          {completed && (
            <Badge variant="success">
              <CheckCircle2 className="size-3" />
              Пройдено
            </Badge>
          )}
        </div>

        <Badge variant="muted" className="mt-4 w-fit">
          {meta.label}
        </Badge>
        <h3 className="mt-2 font-semibold leading-snug transition-colors group-hover:text-primary">
          {resource.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {resource.summary}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>{resource.category}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {resource.readMinutes} {plural(resource.readMinutes, ['минута', 'минуты', 'минут'])}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
