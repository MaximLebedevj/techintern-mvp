import { z } from 'zod';

const url = z.string().url('Некорректная ссылка').or(z.literal('')).optional();

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Укажите имя'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  role: z.enum(['STUDENT', 'COMPANY']),
});
export type RegisterValues = z.infer<typeof registerSchema>;

export const studentProfileSchema = z.object({
  fullName: z.string().min(2, 'Укажите имя'),
  headline: z.string().max(160).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
  university: z.string().max(160).optional().or(z.literal('')),
  course: z.coerce.number().int().min(1).max(6).optional(),
  specialization: z
    .enum(['FRONTEND', 'BACKEND', 'DATA_SCIENCE', 'DEVOPS', 'MOBILE', 'FUNDAMENTALS'])
    .optional(),
  level: z.enum(['INTERN', 'JUNIOR', 'MIDDLE']),
  experienceYears: z.coerce.number().min(0).max(10),
  githubUrl: url,
  telegram: z.string().max(64).optional().or(z.literal('')),
  websiteUrl: url,
  openToWork: z.boolean(),
});
export type StudentProfileValues = z.infer<typeof studentProfileSchema>;

export const projectSchema = z.object({
  title: z.string().min(2, 'Введите название'),
  description: z.string().min(10, 'Опишите проект подробнее'),
  technologies: z.array(z.string()).min(1, 'Добавьте хотя бы одну технологию'),
  role: z.string().max(80).optional().or(z.literal('')),
  url: url,
  githubUrl: url,
});
export type ProjectValues = z.infer<typeof projectSchema>;

export const companyProfileSchema = z.object({
  name: z.string().min(2, 'Укажите название'),
  description: z.string().max(3000).optional().or(z.literal('')),
  website: url,
  city: z.string().max(80).optional().or(z.literal('')),
  industry: z.string().max(80).optional().or(z.literal('')),
  size: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
});
export type CompanyProfileValues = z.infer<typeof companyProfileSchema>;

export const vacancySkillSchema = z.object({
  skillId: z.string().min(1),
  required: z.boolean().default(true),
  weight: z.coerce.number().min(0.1).max(3).default(1),
});

export const vacancySchema = z.object({
  title: z.string().min(4, 'Введите название вакансии'),
  description: z.string().min(20, 'Опишите вакансию подробнее'),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
  city: z.string().max(80).optional().or(z.literal('')),
  workFormat: z.enum(['OFFICE', 'REMOTE', 'HYBRID']),
  employmentType: z.enum(['INTERNSHIP', 'PART_TIME', 'FULL_TIME']),
  level: z.enum(['INTERN', 'JUNIOR', 'MIDDLE']),
  experienceYears: z.coerce.number().min(0).max(5),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  skills: z.array(vacancySkillSchema).min(1, 'Добавьте хотя бы один навык'),
});
export type VacancyFormValues = z.infer<typeof vacancySchema>;
