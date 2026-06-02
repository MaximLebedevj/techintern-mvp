import { useState } from 'react';
import {
  CheckCircle2,
  Flame,
  ListTodo,
  Loader2,
  Plus,
  Repeat,
  Target,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useArchiveHabit,
  useCheckinHabit,
  useCreateGoal,
  useCreateHabit,
  useDeleteGoal,
  useGoals,
  useHabits,
  useUpdateGoal,
} from '@/hooks/use-skillproof';
import type { Goal, Habit } from '@/types/skillproof';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const todayKey = () => new Date().toISOString().slice(0, 10);
const dayKey = (offset: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
};

export function GoalsHabitsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="SkillProof"
        title="Цели и привычки"
        description="Ставьте SMART-цели и отмечайте привычки. Регулярность напрямую растит ваш Skill Score и серию."
      />
      <GoalsSection />
      <HabitsSection />
    </div>
  );
}

// --- Цели -------------------------------------------------------------------

function GoalsSection() {
  const { data: goals, isLoading } = useGoals();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Target className="size-5 text-primary" />
          SMART-цели
        </h2>
        <CreateGoalDialog />
      </div>
      {isLoading ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : goals && goals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <EmptyState icon={ListTodo} title="Пока нет целей" description="Поставьте первую SMART-цель." />
      )}
    </section>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const update = useUpdateGoal();
  const remove = useDeleteGoal();
  const done = goal.status === 'COMPLETED';
  const pct =
    goal.metricTarget && goal.metricTarget > 0
      ? Math.min(100, Math.round((goal.metricCurrent / goal.metricTarget) * 100))
      : done
        ? 100
        : 0;

  const bump = (delta: number) =>
    update.mutate({
      id: goal.id,
      data: { metricCurrent: Math.max(0, goal.metricCurrent + delta) },
    });

  return (
    <Card className={cn('p-5', done && 'border-success/40 bg-success/5')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{goal.title}</h3>
          {goal.specific && <p className="text-sm text-muted-foreground">{goal.specific}</p>}
        </div>
        <button
          onClick={() => remove.mutate(goal.id)}
          className="text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Удалить"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {goal.metricTarget != null && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {goal.metricCurrent} / {goal.metricTarget} {goal.unit ?? ''}
            </span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {done ? (
            <Badge variant="success">
              <CheckCircle2 className="size-3" /> Выполнено
            </Badge>
          ) : goal.dueDate ? (
            <span>до {formatDate(goal.dueDate)}</span>
          ) : (
            <Badge variant="muted">в работе</Badge>
          )}
        </div>
        {!done && goal.metricTarget != null && (
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => bump(-1)} disabled={update.isPending}>
              −1
            </Button>
            <Button variant="outline" size="sm" onClick={() => bump(1)} disabled={update.isPending}>
              +1
            </Button>
          </div>
        )}
        {!done && goal.metricTarget == null && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => update.mutate({ id: goal.id, data: { status: 'COMPLETED' } })}
          >
            Завершить
          </Button>
        )}
      </div>
    </Card>
  );
}

function CreateGoalDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [measurable, setMeasurable] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const create = useCreateGoal();

  const submit = async () => {
    if (title.trim().length < 3) return;
    try {
      await create.mutateAsync({
        title: title.trim(),
        measurable: measurable || undefined,
        metricTarget: target ? Number(target) : undefined,
        unit: unit || undefined,
        dueDate: dueDate || undefined,
      });
      toast.success('Цель создана');
      setOpen(false);
      setTitle('');
      setMeasurable('');
      setTarget('');
      setUnit('');
      setDueDate('');
    } catch {
      toast.error('Не удалось создать цель');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="size-4" />
          Новая цель
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая SMART-цель</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Цель</Label>
            <Input placeholder="Решить 100 задач на Codewars" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Как измеряем</Label>
            <Input placeholder="Количество решённых задач" value={measurable} onChange={(e) => setMeasurable(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Цель (число)</Label>
              <Input type="number" min={1} placeholder="100" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Единица</Label>
              <Input placeholder="задач" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Срок (необязательно)</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button variant="gradient" onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Привычки ---------------------------------------------------------------

function HabitsSection() {
  const { data: habits, isLoading } = useHabits();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Repeat className="size-5 text-primary" />
          Привычки
        </h2>
        <CreateHabitDialog />
      </div>
      {isLoading ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : habits && habits.length > 0 ? (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {habits.map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={Repeat} title="Пока нет привычек" description="Добавьте привычку и отмечайте её каждый день." />
      )}
    </section>
  );
}

function HabitRow({ habit }: { habit: Habit }) {
  const checkin = useCheckinHabit();
  const archive = useArchiveHabit();
  const done = new Set(habit.checkins.map((c) => c.date));
  const doneToday = done.has(todayKey());

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium" style={habit.color ? { color: undefined } : undefined}>
          {habit.title}
        </p>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: 14 }, (_, i) => 13 - i).map((offset) => {
            const key = dayKey(offset);
            const isDone = done.has(key);
            return (
              <span
                key={key}
                title={key}
                className={cn('size-3.5 rounded-[3px]', isDone ? 'bg-primary' : 'bg-muted')}
              />
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={doneToday ? 'outline' : 'gradient'}
          size="sm"
          onClick={() => checkin.mutate(habit.id)}
          disabled={checkin.isPending || doneToday}
        >
          {doneToday ? <CheckCircle2 className="size-4" /> : <Flame className="size-4" />}
          {doneToday ? 'Отмечено' : 'Отметить'}
        </Button>
        <button
          onClick={() => archive.mutate(habit.id)}
          className="text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Архивировать"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function CreateHabitDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const create = useCreateHabit();

  const submit = async () => {
    if (title.trim().length < 2) return;
    try {
      await create.mutateAsync({ title: title.trim() });
      toast.success('Привычка добавлена');
      setOpen(false);
      setTitle('');
    } catch {
      toast.error('Не удалось добавить привычку');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="size-4" />
          Новая привычка
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая привычка</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Название</Label>
          <Input
            placeholder="Коммит каждый день"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button variant="gradient" onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
