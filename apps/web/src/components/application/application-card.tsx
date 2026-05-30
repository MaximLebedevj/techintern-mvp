import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { Application } from '@/types/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatusTracker } from './status-tracker';
import { APPLICATION_STATUS_META } from '@/lib/constants';
import { formatRelative } from '@/lib/format';
import { initials } from '@/lib/utils';
import { scoreTone } from '@/components/match/match-ring';

export function ApplicationCard({ application }: { application: Application }) {
  const { vacancy } = application;
  const company = vacancy.company;
  const meta = APPLICATION_STATUS_META[application.status];
  const tone = scoreTone(application.matchScore);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Avatar className="size-11 rounded-xl">
            {company.logoUrl && <AvatarImage src={company.logoUrl} alt={company.name} />}
            <AvatarFallback className="rounded-xl">{initials(company.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link
              to={`/app/vacancies/${vacancy.id}`}
              className="font-semibold leading-snug hover:text-primary"
            >
              {vacancy.title}
            </Link>
            <p className="text-sm text-muted-foreground">{company.name}</p>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              {vacancy.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {vacancy.city}
                </span>
              )}
              <span>Отклик {formatRelative(application.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ color: tone.stroke, background: `${tone.stroke}1a` }}
          >
            {application.matchScore}% match
          </span>
          <Badge
            variant={
              meta.tone === 'success'
                ? 'success'
                : meta.tone === 'warning'
                  ? 'warning'
                  : meta.tone === 'destructive'
                    ? 'destructive'
                    : 'default'
            }
          >
            {meta.emoji} {meta.label}
          </Badge>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <StatusTracker status={application.status} />
      </div>
    </Card>
  );
}
