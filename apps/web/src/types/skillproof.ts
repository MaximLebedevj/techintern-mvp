/**
 * Контракт API для SkillProof (паспорт навыков, streaks, верификация, геймификация).
 * Зеркало backend-модулей gamification / verification / passport / habits / challenges.
 */
import type { SeniorityLevel, SkillCategory } from './api';

export type League = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
export type IntegrationProvider = 'GITHUB' | 'CODEWARS' | 'LEETCODE' | 'STEPIK';
export type IntegrationStatus = 'CONNECTED' | 'SYNCING' | 'ERROR';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type HabitCadence = 'DAILY' | 'WEEKLY';

export interface ScoreBreakdown {
  streak: number;
  volume: number;
  social: number;
}

export interface MarketComparison {
  specialization: SkillCategory | null;
  total: number;
  rank: number;
  topPercent: number;
}

export interface PassportBadge {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tier: string | null;
  awardedAt: string;
}

export interface ActivityProofItem {
  source: string;
  type: string;
  title: string;
  url: string | null;
  occurredAt: string;
  weight: number;
}

export interface IntegrationSummary {
  provider: IntegrationProvider;
  username: string;
  status: IntegrationStatus;
  stats: Record<string, unknown> | null;
  lastSyncedAt: string | null;
}

export interface SkillPassport {
  student: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    headline: string | null;
    specialization: SkillCategory | null;
    level: SeniorityLevel;
  };
  skillScore: number;
  league: League;
  leagueLabel: string;
  nextLeague: { league: League; pointsTo: number } | null;
  scoreBreakdown: ScoreBreakdown;
  streak: {
    current: number;
    longest: number;
    consistency30: number;
    daysSinceActive: number | null;
    withering: boolean;
  };
  market: MarketComparison | null;
  provenTech: { name: string; verified: boolean }[];
  integrations: IntegrationSummary[];
  badges: PassportBadge[];
  recentActivity: ActivityProofItem[];
  stats: {
    githubCommits: number;
    githubStars: number;
    githubRepos: number;
    codewarsSolved: number;
    totalProofs: number;
    projects: number;
    activeDays90: number;
  };
  generatedAt: string;
}

export interface ProgressSummary {
  skillScore: number;
  league: League;
  leagueLabel: string;
  nextLeague: { league: League; pointsTo: number } | null;
  scoreBreakdown: ScoreBreakdown;
  currentStreak: number;
  longestStreak: number;
  consistency30: number;
  streakFreezes: number;
  daysSinceActive: number | null;
  withering: boolean;
  market: MarketComparison | null;
}

export interface ActivityCalendar {
  from: string;
  to: string;
  days: { date: string; count: number; sources: string[] }[];
}

export interface Goal {
  id: string;
  title: string;
  specific: string | null;
  measurable: string | null;
  metricTarget: number | null;
  metricCurrent: number;
  unit: string | null;
  skillSlug: string | null;
  dueDate: string | null;
  status: GoalStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface Habit {
  id: string;
  title: string;
  cadence: HabitCadence;
  targetPerPeriod: number;
  skillSlug: string | null;
  color: string | null;
  archived: boolean;
  checkins: { date: string; count: number }[];
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  fullName: string;
  avatarUrl: string | null;
  specialization: SkillCategory | null;
  skillScore: number;
  league: League;
  currentStreak: number;
}

export interface BadgeCatalogItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tier?: string;
}

export interface Guild {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  emblem: string | null;
  memberCount: number;
  totalScore: number;
  members: { id: string; fullName: string; avatarUrl: string | null; skillScore: number }[];
}

export interface Duel {
  id: string;
  type: 'DUEL' | 'GUILD';
  title: string;
  metric: string;
  metricLabel: string;
  target: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DECLINED';
  startsAt: string;
  endsAt: string;
  challengerProgress: number;
  opponentProgress: number;
  winnerId: string | null;
  isChallenger: boolean;
  challenger: { id: string; fullName: string; avatarUrl: string | null } | null;
  opponent: { id: string; fullName: string; avatarUrl: string | null } | null;
}

/** Снимок паспорта, приложенный к отклику. */
export interface PassportSnapshot {
  skillScore: number;
  league: League;
  leagueLabel: string;
  currentStreak: number;
  longestStreak: number;
  consistency30: number;
  topPercent: number | null;
  badgeCount: number;
  provenTech: string[];
  githubCommits: number;
  codewarsSolved: number;
  activeDays90: number;
  capturedAt: string;
}

/** Метрики вовлечённости в карточке кандидата. */
export interface Engagement {
  skillScore: number;
  league: League;
  currentStreak: number;
  consistency30: number;
}
