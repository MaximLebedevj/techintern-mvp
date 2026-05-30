import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, MapPin, Sparkles } from 'lucide-react';
import type { CandidateCard as Candidate } from '@/types/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MatchRing } from '@/components/match/match-ring';
import { CATEGORY_LABELS, SENIORITY_LABELS } from '@/lib/constants';
import { initials } from '@/lib/utils';

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="h-full">
      <Link
        to={`/app/candidates/${candidate.id}`}
        className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:border-primary/30 hover:shadow-card-hover"
      >
        <div className="flex items-start gap-3">
          <Avatar className="size-12">
            {candidate.avatarUrl && <AvatarImage src={candidate.avatarUrl} alt={candidate.fullName} />}
            <AvatarFallback>{initials(candidate.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 font-semibold leading-snug transition-colors group-hover:text-primary">
              <span className="truncate">{candidate.fullName}</span>
              {candidate.isPremium && <Sparkles className="size-3.5 shrink-0 text-warning" />}
            </h3>
            {candidate.headline && (
              <p className="line-clamp-1 text-sm text-muted-foreground">{candidate.headline}</p>
            )}
          </div>
          {candidate.match && <MatchRing score={candidate.match.score} size={56} strokeWidth={5} showLabel={false} />}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{SENIORITY_LABELS[candidate.level]}</Badge>
          {candidate.specialization && (
            <Badge variant="muted">{CATEGORY_LABELS[candidate.specialization]}</Badge>
          )}
          {candidate.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {candidate.city}
            </span>
          )}
        </div>

        {candidate.university && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <GraduationCap className="size-3.5" />
            {candidate.university}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {candidate.topSkills.slice(0, 5).map((skill) => (
            <span
              key={skill.name}
              className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-medium text-accent-foreground"
            >
              {skill.name}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}
