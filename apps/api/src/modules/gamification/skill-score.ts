/**
 * Чистое ядро Skill Score. Без зависимостей от Nest/Prisma — легко тестируется.
 * Формула из концепции: streaks 40% + объём работы 30% + социальное признание 30%.
 * Итог — 0..1000.
 */

export interface ScoreInputs {
  currentStreak: number; // дней подряд
  activeDaysLast30: number; // активных дней за 30 дней
  weightedProofs90: number; // сумма весов доказательств за 90 дней
  social: {
    stars: number; // звёзды GitHub
    followers: number; // подписчики GitHub
    codewarsHonor: number; // honor на Codewars
    offers: number; // полученные офферы (трудоустройство как соц. признание)
  };
}

export interface ScoreResult {
  score: number; // 0..1000
  breakdown: { streak: number; volume: number; social: number }; // вклад каждого блока в баллах
  consistency30: number; // 0..1
}

const STREAK_WEIGHT = 400; // 40%
const VOLUME_WEIGHT = 300; // 30%
const SOCIAL_WEIGHT = 300; // 30%

const STREAK_TARGET_DAYS = 30;
const VOLUME_CAP = 200;
const SOCIAL_CAP = 400;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const logNorm = (value: number, cap: number): number =>
  clamp01(Math.log1p(Math.max(0, value)) / Math.log1p(cap));

export function computeSkillScore(inputs: ScoreInputs): ScoreResult {
  const consistency30 = clamp01(inputs.activeDaysLast30 / 30);

  // Блок дисциплины: длина серии + регулярность.
  const fStreak = clamp01(
    0.6 * Math.min(inputs.currentStreak / STREAK_TARGET_DAYS, 1) + 0.4 * consistency30,
  );
  const streak = STREAK_WEIGHT * fStreak;

  // Блок объёма: сколько реальной работы подтверждено (логарифмическая шкала).
  const volume = VOLUME_WEIGHT * logNorm(inputs.weightedProofs90, VOLUME_CAP);

  // Блок социального признания.
  const socialRaw =
    inputs.social.stars * 3 +
    inputs.social.followers * 2 +
    inputs.social.codewarsHonor * 0.1 +
    inputs.social.offers * 50;
  const social = SOCIAL_WEIGHT * logNorm(socialRaw, SOCIAL_CAP);

  const score = Math.round(streak + volume + social);

  return {
    score: Math.max(0, Math.min(1000, score)),
    breakdown: {
      streak: Math.round(streak),
      volume: Math.round(volume),
      social: Math.round(social),
    },
    consistency30,
  };
}
