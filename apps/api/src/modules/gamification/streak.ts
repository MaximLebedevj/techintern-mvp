/**
 * Подсчёт серий активности (streaks) из набора активных дат.
 * Работаем со строками 'YYYY-MM-DD', чтобы избежать проблем с часовыми поясами.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
export const STREAK_GRACE_DAYS = 7; // после стольких дней простоя ветви «увядают»

export const toDayKey = (date: Date): string => date.toISOString().slice(0, 10);

const fromDayKey = (key: string): number => new Date(`${key}T00:00:00Z`).getTime();

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  activeDaysLast30: number;
  lastActiveDate: string | null;
  /** «Увядание»: дней с последней активности больше grace-периода. */
  withering: boolean;
  daysSinceActive: number | null;
}

export function computeStreaks(activeDateKeys: string[], today: Date = new Date()): StreakResult {
  const unique = Array.from(new Set(activeDateKeys)).sort(); // по возрастанию
  if (unique.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      activeDaysLast30: 0,
      lastActiveDate: null,
      withering: false,
      daysSinceActive: null,
    };
  }

  // Самая длинная серия.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const diff = Math.round((fromDayKey(unique[i]!) - fromDayKey(unique[i - 1]!)) / DAY_MS);
    run = diff === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Текущая серия: считаем назад от сегодня (допускаем «сегодня ещё не отметился»).
  const todayKey = toDayKey(today);
  const todayMs = fromDayKey(todayKey);
  const lastKey = unique[unique.length - 1]!;
  const daysSinceActive = Math.round((todayMs - fromDayKey(lastKey)) / DAY_MS);

  const activeSet = new Set(unique);
  let current = 0;
  if (daysSinceActive <= 1) {
    // Стартуем с последнего активного дня и идём назад.
    let cursor = fromDayKey(lastKey);
    while (activeSet.has(toDayKey(new Date(cursor)))) {
      current += 1;
      cursor -= DAY_MS;
    }
  }

  const cutoff = todayMs - 30 * DAY_MS;
  const activeDaysLast30 = unique.filter((k) => fromDayKey(k) >= cutoff).length;

  return {
    currentStreak: current,
    longestStreak: longest,
    activeDaysLast30,
    lastActiveDate: lastKey,
    withering: daysSinceActive > STREAK_GRACE_DAYS,
    daysSinceActive,
  };
}
