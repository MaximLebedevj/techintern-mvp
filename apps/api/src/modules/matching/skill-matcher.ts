import type { SeniorityLevel } from '@prisma/client';
import { cosineSimilarity, textCosine, tokenize } from './tfidf';
import type { MatchResult, StudentVector, VacancyVector } from './matching.types';

/**
 * Доменное ядро AI-скоринга. Чистая, детерминированная и объяснимая функция:
 * сравнивает профиль студента с требованиями вакансии и возвращает 0..100 + причины.
 *
 * Подход: навыки и технологии проектов проецируются в общее токен-пространство,
 * взвешиваются по IDF (редкие навыки ценнее) и сравниваются косинусной близостью.
 * Дополнительно учитываются текстовая близость и соответствие уровня/опыта.
 */

const LEVEL_RANK: Record<SeniorityLevel, number> = { INTERN: 0, JUNIOR: 1, MIDDLE: 2 };

// Веса итоговой оценки (навыки доминируют — это продуктово верно для junior-найма).
const W_SKILLS = 0.72;
const W_TEXT = 0.1;
const W_LEVEL = 0.18;

const PROJECT_BOOST = 0.35; // вклад технологии из проекта в «владение» навыком
const NON_REQUIRED_FACTOR = 0.6; // вес желательных (не обязательных) навыков вакансии
const DEFAULT_IDF = 1;
const MATCH_THRESHOLD = 0.05; // порог, при котором навык считается «закрытым»

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const round = (value: number): number => Math.round(value);

/** Карта токен → «сила» владения студентом (0..1) до взвешивания IDF. */
const buildStudentTokenValues = (student: StudentVector): Map<string, number> => {
  const map = new Map<string, number>();
  for (const skill of student.skills) {
    const value = clamp01(skill.progress / 100);
    for (const token of tokenize(skill.name)) {
      map.set(token, Math.max(map.get(token) ?? 0, value));
    }
  }
  // Проекты — доказательство практического владения: усиливаем соответствующие токены.
  for (const tech of student.projectTechnologies) {
    for (const token of tokenize(tech)) {
      map.set(token, Math.min(1, (map.get(token) ?? 0) + PROJECT_BOOST));
    }
  }
  return map;
};

/** Карта токен → важность для вакансии (вес × фактор обязательности) до IDF. */
const buildVacancyTokenValues = (vacancy: VacancyVector): Map<string, number> => {
  const map = new Map<string, number>();
  for (const skill of vacancy.skills) {
    const value = skill.weight * (skill.required ? 1 : NON_REQUIRED_FACTOR);
    for (const token of tokenize(skill.name)) {
      map.set(token, Math.max(map.get(token) ?? 0, value));
    }
  }
  return map;
};

const applyIdf = (
  tokens: Map<string, number>,
  idf: Map<string, number>,
): Map<string, number> => {
  const vector = new Map<string, number>();
  for (const [token, value] of tokens) {
    vector.set(token, value * (idf.get(token) ?? DEFAULT_IDF));
  }
  return vector;
};

/** Соответствие уровня/опыта: 0..1. */
const computeLevelFit = (student: StudentVector, vacancy: VacancyVector): number => {
  const reqRank = LEVEL_RANK[vacancy.level];
  const stuRank = LEVEL_RANK[student.level];
  const levelFit = stuRank >= reqRank ? 1 : Math.max(0.45, 1 - (reqRank - stuRank) * 0.35);

  const reqExp = vacancy.experienceYears;
  const expFit =
    reqExp <= 0 ? 1 : Math.min(1, (student.experienceYears + 0.5) / (reqExp + 0.5));

  return clamp01(0.6 * levelFit + 0.4 * expFit);
};

/** Средняя «закрытость» набора токенов студентом (0..1). */
const effectiveCoverage = (tokens: string[], studentTokens: Map<string, number>): number => {
  if (tokens.length === 0) return 0;
  const total = tokens.reduce((sum, token) => sum + (studentTokens.get(token) ?? 0), 0);
  return total / tokens.length;
};

export const computeMatch = (
  student: StudentVector,
  vacancy: VacancyVector,
  skillIdf: Map<string, number>,
): MatchResult => {
  const studentTokens = buildStudentTokenValues(student);
  const vacancyTokens = buildVacancyTokenValues(vacancy);

  const studentVec = applyIdf(studentTokens, skillIdf);
  const vacancyVec = applyIdf(vacancyTokens, skillIdf);

  const skillCos = cosineSimilarity(studentVec, vacancyVec); // 0..1
  const textCos = textCosine(student.text, vacancy.text); // 0..1
  const levelFit = computeLevelFit(student, vacancy); // 0..1

  const score = round(100 * (W_SKILLS * skillCos + W_TEXT * textCos + W_LEVEL * levelFit));

  // Разбор по навыкам вакансии: что закрыто, чего не хватает и сколько даст добор.
  const matchedSkills: MatchResult['matchedSkills'] = [];
  const missingSkills: MatchResult['missingSkills'] = [];

  for (const vs of vacancy.skills) {
    const tokens = tokenize(vs.name);
    const coverage = effectiveCoverage(tokens, studentTokens);
    if (coverage > MATCH_THRESHOLD) {
      matchedSkills.push({ name: vs.name, progress: round(clamp01(coverage) * 100) });
      continue;
    }
    // Маржинальный вклад навыка: насколько вырастет итог, если довести его до 100%.
    const boosted = new Map(studentTokens);
    for (const token of tokens) boosted.set(token, 1);
    const boostedCos = cosineSimilarity(applyIdf(boosted, skillIdf), vacancyVec);
    const gain = Math.max(1, round(W_SKILLS * (boostedCos - skillCos) * 100));
    missingSkills.push({ name: vs.name, potentialGain: gain });
  }

  missingSkills.sort((a, b) => b.potentialGain - a.potentialGain);
  matchedSkills.sort((a, b) => b.progress - a.progress);

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown: {
      skills: round(skillCos * 100),
      text: round(textCos * 100),
      level: round(levelFit * 100),
    },
    matchedSkills,
    missingSkills,
    explanation: buildExplanation(score, matchedSkills, missingSkills, student, vacancy),
  };
};

/** Человекочитаемые подсказки на русском — объяснимость скоринга обязательна. */
const buildExplanation = (
  score: number,
  matched: MatchResult['matchedSkills'],
  missing: MatchResult['missingSkills'],
  student: StudentVector,
  vacancy: VacancyVector,
): string[] => {
  const lines: string[] = [];

  if (score >= 80) {
    lines.push('Отличное совпадение — высокий приоритет в рекомендациях.');
  } else if (score >= 55) {
    lines.push('Хорошее совпадение — стоит откликнуться.');
  } else if (score >= 30) {
    lines.push('Частичное совпадение — добор навыков заметно повысит шансы.');
  } else {
    lines.push('Низкое совпадение — вакансия слабо соответствует профилю.');
  }

  if (matched.length > 0) {
    const names = matched.slice(0, 4).map((m) => m.name).join(', ');
    lines.push(`Совпадение по ключевым технологиям: ${names}.`);
  }

  for (const skill of missing.slice(0, 3)) {
    lines.push(`Добавьте опыт с «${skill.name}» — +${skill.potentialGain}% к скорингу.`);
  }

  if (LEVEL_RANK[student.level] < LEVEL_RANK[vacancy.level]) {
    lines.push('Уровень вакансии выше вашего — усильте профиль реальными проектами.');
  }

  if (vacancy.experienceYears > student.experienceYears) {
    lines.push(
      `Требуется опыт ~${vacancy.experienceYears} г. — подчеркните релевантные проекты, чтобы это компенсировать.`,
    );
  }

  return lines;
};
