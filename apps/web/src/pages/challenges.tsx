import { Crown, Shield, Swords } from 'lucide-react';
import { toast } from 'sonner';
import {
  useChallenges,
  useGuilds,
  useJoinGuild,
  useLeaveGuild,
  useLeaderboard,
  useMyGuild,
  useRespondDuel,
} from '@/hooks/use-skillproof';
import { useAuth } from '@/hooks/use-auth';
import type { Duel } from '@/types/skillproof';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeagueBadge } from '@/components/skillproof/league-badge';
import { formatNumber } from '@/lib/format';
import { initials, cn } from '@/lib/utils';

export function ChallengesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SkillProof"
        title="Челленджи"
        description="Соревнуйтесь в лигах, объединяйтесь в гильдии и вызывайте других на дуэли по активности."
      />
      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Лидерборд</TabsTrigger>
          <TabsTrigger value="guilds">Гильдии</TabsTrigger>
          <TabsTrigger value="duels">Дуэли</TabsTrigger>
        </TabsList>
        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>
        <TabsContent value="guilds">
          <Guilds />
        </TabsContent>
        <TabsContent value="duels">
          <Duels />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Leaderboard() {
  const { data, isLoading } = useLeaderboard();
  const { user } = useAuth();
  const myId = user?.student?.id;

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!data || data.length === 0) {
    return <EmptyState icon={Crown} title="Лидерборд пуст" description="Будьте первым в рейтинге!" />;
  }

  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {data.map((entry) => (
          <div
            key={entry.studentId}
            className={cn(
              'flex items-center gap-3 p-4',
              entry.studentId === myId && 'bg-accent/50',
            )}
          >
            <span
              className={cn(
                'w-7 text-center font-display text-lg font-bold',
                entry.rank === 1 ? 'text-yellow-500' : entry.rank <= 3 ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {entry.rank}
            </span>
            <Avatar className="size-9">
              {entry.avatarUrl && <AvatarImage src={entry.avatarUrl} alt={entry.fullName} />}
              <AvatarFallback>{initials(entry.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {entry.fullName}
                {entry.studentId === myId && <span className="ml-1.5 text-xs text-primary">(вы)</span>}
              </p>
              <p className="text-xs text-muted-foreground">🔥 {entry.currentStreak} дн. серия</p>
            </div>
            <LeagueBadge league={entry.league} />
            <span className="w-16 text-right font-display text-lg font-bold tabular-nums">
              {entry.skillScore}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Guilds() {
  const { data: guilds, isLoading } = useGuilds();
  const { data: myGuild } = useMyGuild();
  const join = useJoinGuild();
  const leave = useLeaveGuild();

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!guilds || guilds.length === 0) {
    return <EmptyState icon={Shield} title="Гильдий пока нет" description="Скоро здесь появятся команды." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {guilds.map((guild, index) => {
        const isMember = myGuild?.guildId === guild.id;
        return (
          <Card key={guild.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-xl bg-accent text-2xl">
                  {guild.emblem ?? '🛡️'}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 font-semibold">
                    {guild.name}
                    {index === 0 && <Crown className="size-4 text-yellow-500" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{guild.memberCount} участников</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-bold text-primary">{formatNumber(guild.totalScore)}</p>
                <p className="text-[11px] text-muted-foreground">очков гильдии</p>
              </div>
            </div>

            <div className="mt-4 flex -space-x-2">
              {guild.members.slice(0, 6).map((m) => (
                <Avatar key={m.id} className="size-8 ring-2 ring-card">
                  {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.fullName} />}
                  <AvatarFallback className="text-[10px]">{initials(m.fullName)}</AvatarFallback>
                </Avatar>
              ))}
            </div>

            <div className="mt-4">
              {isMember ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    await leave.mutateAsync();
                    toast.success('Вы покинули гильдию');
                  }}
                >
                  Покинуть гильдию
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    await join.mutateAsync(guild.id);
                    toast.success(`Вы вступили в «${guild.name}»`);
                  }}
                >
                  Вступить
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Duels() {
  const { data, isLoading } = useChallenges();

  if (isLoading) return <Skeleton className="h-48 rounded-2xl" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Swords}
        title="Дуэлей пока нет"
        description="Вызовите соперника из лидерборда, чтобы устроить соревнование по активности."
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.map((duel) => (
        <DuelCard key={duel.id} duel={duel} />
      ))}
    </div>
  );
}

function DuelCard({ duel }: { duel: Duel }) {
  const respond = useRespondDuel();
  const myProgress = duel.isChallenger ? duel.challengerProgress : duel.opponentProgress;
  const theirProgress = duel.isChallenger ? duel.opponentProgress : duel.challengerProgress;
  const opponent = duel.isChallenger ? duel.opponent : duel.challenger;
  const canRespond = !duel.isChallenger && duel.status === 'PENDING';

  const statusLabel: Record<Duel['status'], string> = {
    PENDING: 'Ожидает ответа',
    ACTIVE: 'Идёт',
    COMPLETED: 'Завершена',
    DECLINED: 'Отклонена',
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="size-4 text-primary" />
          <span className="font-semibold">{duel.title}</span>
        </div>
        <span className="text-xs text-muted-foreground">{statusLabel[duel.status]}</span>
      </div>

      <div className="mt-4 space-y-3">
        <DuelBar label="Вы" value={myProgress} target={duel.target} highlight />
        <DuelBar label={opponent?.fullName ?? 'Соперник'} value={theirProgress} target={duel.target} />
      </div>

      {duel.status === 'COMPLETED' && (
        <p className="mt-3 text-sm font-medium">
          {duel.winnerId === null
            ? '🤝 Ничья'
            : (duel.isChallenger && duel.winnerId === duel.challenger?.id) ||
                (!duel.isChallenger && duel.winnerId === duel.opponent?.id)
              ? '🏆 Вы победили!'
              : 'Соперник победил'}
        </p>
      )}

      {canRespond && (
        <div className="mt-4 flex gap-2">
          <Button
            variant="gradient"
            size="sm"
            onClick={() => respond.mutate({ id: duel.id, accept: true })}
          >
            Принять вызов
          </Button>
          <Button variant="ghost" size="sm" onClick={() => respond.mutate({ id: duel.id, accept: false })}>
            Отклонить
          </Button>
        </div>
      )}
    </Card>
  );
}

function DuelBar({
  label,
  value,
  target,
  highlight,
}: {
  label: string;
  value: number;
  target: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={cn('truncate', highlight && 'font-semibold')}>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {value} / {target}
        </span>
      </div>
      <Progress value={Math.min(100, (value / target) * 100)} className="h-2" />
    </div>
  );
}
