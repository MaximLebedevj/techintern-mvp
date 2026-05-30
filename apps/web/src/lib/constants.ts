import type {
  ApplicationStatus,
  CompanySize,
  EmploymentType,
  SeniorityLevel,
  SkillCategory,
  WorkFormat,
} from '@/types/api';

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  INTERN: 'Стажёр',
  JUNIOR: 'Junior',
  MIDDLE: 'Middle',
};

export const WORK_FORMAT_LABELS: Record<WorkFormat, string> = {
  OFFICE: 'Офис',
  REMOTE: 'Удалёнка',
  HYBRID: 'Гибрид',
};

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  INTERNSHIP: 'Стажировка',
  PART_TIME: 'Частичная занятость',
  FULL_TIME: 'Полная занятость',
};

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  DATA_SCIENCE: 'Data Science',
  DEVOPS: 'DevOps',
  MOBILE: 'Mobile',
  FUNDAMENTALS: 'Основы',
};

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  STARTUP: 'Стартап',
  SMALL: 'Небольшая (10–50)',
  MEDIUM: 'Средняя (50–250)',
  LARGE: 'Крупная (250–1000)',
  ENTERPRISE: 'Корпорация (1000+)',
};

export type StatusTone = 'warning' | 'success' | 'primary' | 'destructive';

interface StatusMeta {
  label: string;
  emoji: string;
  tone: StatusTone;
}

/** Метаданные статус-трекера откликов (⏳ → ✅ → 🎯). */
export const APPLICATION_STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  PENDING: { label: 'На рассмотрении', emoji: '⏳', tone: 'warning' },
  INVITED: { label: 'Приглашение', emoji: '✅', tone: 'success' },
  OFFER: { label: 'Оффер', emoji: '🎯', tone: 'primary' },
  REJECTED: { label: 'Отказ', emoji: '❌', tone: 'destructive' },
};

/** Положительный путь трекера (для пошагового отображения прогресса). */
export const TRACKER_FLOW: ApplicationStatus[] = ['PENDING', 'INVITED', 'OFFER'];

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value: value as SkillCategory,
  label,
}));

export const WORK_FORMAT_OPTIONS = Object.entries(WORK_FORMAT_LABELS).map(([value, label]) => ({
  value: value as WorkFormat,
  label,
}));

export const EMPLOYMENT_OPTIONS = Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => ({
  value: value as EmploymentType,
  label,
}));

export const SENIORITY_OPTIONS = Object.entries(SENIORITY_LABELS).map(([value, label]) => ({
  value: value as SeniorityLevel,
  label,
}));
