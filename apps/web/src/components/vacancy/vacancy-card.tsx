import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Banknote, MapPin, Users } from 'lucide-react';
import type { Vacancy } from '@/types/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EMPLOYMENT_LABELS, SENIORITY_LABELS, WORK_FORMAT_LABELS } from '@/lib/constants';
import { formatRelative, formatSalary, pluralWithCount } from '@/lib/format';
import { initials } from '@/lib/utils';
import { scoreTone } from '@/components/match/match-ring';

export function VacancyCard({ vacancy }: { vacancy: Vacancy }) {
  const company = vacancy.company;
  const applicants = vacancy._count?.applications ?? 0;
  const match = vacancy.match?.score;

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link
        to={`/app/vacancies/${vacancy.id}`}
        className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:border-primary/30 hover:shadow-card-hover"
      >
        <div className="flex items-start gap-3">
          <Avatar className="size-11 rounded-xl">
            {company.logoUrl && <AvatarImage src={company.logoUrl} alt={company.name} />}
            <AvatarFallback className="rounded-xl">{initials(company.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">
              {vacancy.title}
            </h3>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{company.name}</p>
          </div>
          {typeof match === 'number' && (
            <span
              className="shrink-0 rounded-full px-2 py-1 text-xs font-bold"
              style={{ color: scoreTone(match).stroke, background: `${scoreTone(match).stroke}1a` }}
            >
              {match}%
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge variant="secondary">{SENIORITY_LABELS[vacancy.level]}</Badge>
          <Badge variant="secondary">{WORK_FORMAT_LABELS[vacancy.workFormat]}</Badge>
          <Badge variant="muted">{EMPLOYMENT_LABELS[vacancy.employmentType]}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {vacancy.skills.slice(0, 5).map((vs) => (
            <span
              key={vs.id}
              className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-medium text-accent-foreground"
            >
              {vs.skill.name}
            </span>
          ))}
          {vacancy.skills.length > 5 && (
            <span className="px-1 text-xs text-muted-foreground">+{vacancy.skills.length - 5}</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-5 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            <Banknote className="size-4 text-muted-foreground" />
            {formatSalary(vacancy.salaryMin, vacancy.salaryMax)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {vacancy.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {vacancy.city}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {pluralWithCount(applicants, ['отклик', 'отклика', 'откликов'])}
          </span>
          <span className="ml-auto">{formatRelative(vacancy.createdAt)}</span>
        </div>
      </Link>
    </motion.div>
  );
}
