import type { SeniorityLevel } from '@prisma/client';

/** Навык студента для вектора матчинга. */
export interface StudentSkillSignal {
  slug: string;
  name: string;
  progress: number; // 0..100
}

/** Требуемый навык вакансии. */
export interface VacancySkillSignal {
  slug: string;
  name: string;
  required: boolean;
  weight: number;
}

/** Нормализованное представление студента для скоринга. */
export interface StudentVector {
  skills: StudentSkillSignal[];
  projectTechnologies: string[]; // плоский список технологий из проектов
  level: SeniorityLevel;
  experienceYears: number;
  text: string; // headline + bio + описания проектов + образование
}

/** Нормализованное представление вакансии для скоринга. */
export interface VacancyVector {
  skills: VacancySkillSignal[];
  level: SeniorityLevel;
  experienceYears: number;
  text: string; // title + description + requirements
}

/** Объяснимый результат матчинга. */
export interface MatchResult {
  score: number; // 0..100
  breakdown: {
    skills: number; // 0..100
    text: number; // 0..100
    level: number; // 0..100
  };
  matchedSkills: { name: string; progress: number }[];
  missingSkills: { name: string; potentialGain: number }[]; // «+15%»
  explanation: string[]; // человекочитаемые подсказки на русском
}
