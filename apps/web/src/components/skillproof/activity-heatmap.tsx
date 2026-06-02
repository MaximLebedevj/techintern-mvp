import { useMemo } from 'react';
import type { ActivityCalendar } from '@/types/skillproof';
import { heatColor } from '@/lib/skillproof';
import { cn } from '@/lib/utils';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS = 20;

const toKey = (d: Date) => d.toISOString().slice(0, 10);

/** GitHub-подобный календарь активности (heatmap). */
export function ActivityHeatmap({ data }: { data: ActivityCalendar }) {
  const { columns, total } = useMemo(() => {
    const counts = new Map(data.days.map((d) => [d.date, d.count]));

    // Старт: понедельник недели (WEEKS-1) назад.
    const today = new Date(toKey(new Date()));
    const start = new Date(today.getTime() - (WEEKS * 7 - 1) * DAY_MS);
    const dow = (start.getUTCDay() + 6) % 7; // 0 = понедельник
    start.setTime(start.getTime() - dow * DAY_MS);

    const cols: { date: string; count: number; future: boolean }[][] = [];
    let sum = 0;
    for (let w = 0; w < WEEKS + 1; w += 1) {
      const week: { date: string; count: number; future: boolean }[] = [];
      for (let d = 0; d < 7; d += 1) {
        const date = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
        const key = toKey(date);
        const count = counts.get(key) ?? 0;
        sum += count;
        week.push({ date: key, count, future: date.getTime() > today.getTime() });
      }
      cols.push(week);
    }
    return { columns: cols, total: sum };
  }, [data]);

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count} активн.`}
                className={cn(
                  'size-3 rounded-[3px]',
                  cell.future ? 'bg-transparent' : heatColor(cell.count),
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} активностей за период</span>
        <span className="flex items-center gap-1.5">
          меньше
          <span className="size-3 rounded-[3px] bg-muted" />
          <span className="size-3 rounded-[3px] bg-primary/40" />
          <span className="size-3 rounded-[3px] bg-primary/70" />
          <span className="size-3 rounded-[3px] bg-primary" />
          больше
        </span>
      </div>
    </div>
  );
}
