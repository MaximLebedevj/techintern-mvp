/**
 * Контракт API (зеркало backend, см. CLAUDE.md §2).
 * Поддерживается в синхроне с Prisma-схемой и DTO NestJS вручную.
 */

export type Role = 'STUDENT' | 'COMPANY' | 'ADMIN';
export type SeniorityLevel = 'INTERN' | 'JUNIOR' | 'MIDDLE';
export type SkillCategory =
  | 'FRONTEND'
  | 'BACKEND'
  | 'DATA_SCIENCE'
  | 'DEVOPS'
  | 'MOBILE'
  | 'FUNDAMENTALS';
export type WorkFormat = 'OFFICE' | 'REMOTE' | 'HYBRID';
export type EmploymentType = 'INTERNSHIP' | 'PART_TIME' | 'FULL_TIME';
export type VacancyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'INVITED' | 'OFFER' | 'REJECTED';
export type CompanyPlan = 'BASIC' | 'PREMIUM';
export type CompanySize = 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
export type ResourceType = 'GUIDE' | 'CHECKLIST' | 'CODE_REVIEW';

// --- Auth -------------------------------------------------------------------

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  student: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    headline: string | null;
    isPremium: boolean;
  } | null;
  company: {
    id: string;
    name: string;
    logoUrl: string | null;
    plan: string;
  } | null;
}

export interface AuthResponse {
  user: SessionUser;
  accessToken: string;
}

export interface OAuthProviders {
  google: boolean;
  github: boolean;
}

// --- Skills -----------------------------------------------------------------

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category: SkillCategory;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
}

export interface SkillNode {
  id: string;
  name: string;
  slug: string;
  category: SkillCategory;
  icon: string | null;
  children: SkillNode[];
}

export interface SkillTreeNode extends SkillNode {
  progress: number;
  children: SkillTreeNode[];
}

export interface SkillTreeResponse {
  tree: SkillTreeNode[];
  categories: { category: SkillCategory; label: string; progress: number }[];
}

// --- Students ---------------------------------------------------------------

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  role: string | null;
  url: string | null;
  githubUrl: string | null;
  createdAt: string;
}

export interface StudentSkill {
  id: string;
  progress: number;
  skill: Skill;
}

export interface StudentProfile {
  id: string;
  userId?: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  city: string | null;
  university: string | null;
  course: number | null;
  specialization: SkillCategory | null;
  level: SeniorityLevel;
  experienceYears: number;
  githubUrl: string | null;
  telegram: string | null;
  websiteUrl: string | null;
  openToWork: boolean;
  isPremium: boolean;
  skills: StudentSkill[];
  projects: Project[];
  _count?: { applications: number };
}

export interface CandidateCard {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  city: string | null;
  university: string | null;
  level: SeniorityLevel;
  specialization: SkillCategory | null;
  isPremium: boolean;
  topSkills: { name: string; progress: number }[];
  projectCount: number;
  match?: Pick<MatchResult, 'score' | 'matchedSkills' | 'missingSkills'>;
  engagement?: import('./skillproof').Engagement | null;
}

// --- Companies --------------------------------------------------------------

export interface CompanyProfile {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  city: string | null;
  industry: string | null;
  size: CompanySize;
  plan: CompanyPlan;
  _count?: { vacancies: number };
}

export interface CompanyStats {
  totalVacancies: number;
  activeVacancies: number;
  totalApplications: number;
  byStatus: Record<ApplicationStatus, number>;
  avgMatch: number;
  conversionToOffer: number;
}

// --- Matching ---------------------------------------------------------------

export interface MatchResult {
  score: number;
  breakdown: { skills: number; text: number; level: number };
  matchedSkills: { name: string; progress: number }[];
  missingSkills: { name: string; potentialGain: number }[];
  explanation: string[];
}

// --- Vacancies --------------------------------------------------------------

export interface VacancySkill {
  id: string;
  required: boolean;
  weight: number;
  skill: Skill;
}

export interface VacancyCompanyRef {
  id: string;
  name: string;
  logoUrl: string | null;
  city: string | null;
}

export interface Vacancy {
  id: string;
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  conditions: string[];
  city: string | null;
  workFormat: WorkFormat;
  employmentType: EmploymentType;
  level: SeniorityLevel;
  experienceYears: number;
  salaryMin: number | null;
  salaryMax: number | null;
  status: VacancyStatus;
  createdAt: string;
  company: VacancyCompanyRef | CompanyProfile;
  skills: VacancySkill[];
  _count?: { applications: number };
  // присутствуют только в детали для студента:
  match?: MatchResult;
  application?: { id: string; status: ApplicationStatus } | null;
}

// --- Applications -----------------------------------------------------------

export interface ApplicationEvent {
  id: string;
  status: ApplicationStatus;
  note: string | null;
  createdAt: string;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  matchScore: number;
  passportSnapshot?: import('./skillproof').PassportSnapshot | null;
  createdAt: string;
  updatedAt: string;
  vacancy: Vacancy;
  events: ApplicationEvent[];
  student?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    headline?: string | null;
    city?: string | null;
    university?: string | null;
    level?: SeniorityLevel;
    specialization?: SkillCategory | null;
    skills?: StudentSkill[];
    _count?: { projects: number };
    progress?: import('./skillproof').Engagement | null;
  };
}

// --- Career Hub -------------------------------------------------------------

export interface CareerResource {
  id: string;
  slug: string;
  type: ResourceType;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  readMinutes: number;
  icon: string | null;
  featured: boolean;
  language: string | null;
  badCode: string | null;
  goodCode: string | null;
  explanation: string | null;
  interviewerQuestions: string[];
  checklistItems: string[];
}

export interface CareerProgress {
  completedIds: string[];
  completedCount: number;
  totalCount: number;
}

// --- Messages ---------------------------------------------------------------

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  student: { id: string; userId: string; fullName: string; avatarUrl: string | null; headline?: string | null };
  company: { id: string; userId: string; name: string; logoUrl: string | null };
  lastMessage?: Message | null;
  updatedAt: string;
}

// --- Общее ------------------------------------------------------------------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
