import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  ActivityCalendar,
  BadgeCatalogItem,
  Duel,
  Goal,
  Guild,
  Habit,
  IntegrationProvider,
  IntegrationSummary,
  LeaderboardEntry,
  PassportBadge,
  ProgressSummary,
  SkillPassport,
} from '@/types/skillproof';
import type { SkillCategory } from '@/types/api';

const SKILLPROOF_KEYS = ['passport', 'progress', 'activity', 'integrations'];

function invalidateProgress(qc: ReturnType<typeof useQueryClient>) {
  SKILLPROOF_KEYS.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
  qc.invalidateQueries({ queryKey: ['badges'] });
}

// --- Паспорт / прогресс / активность ----------------------------------------

export function usePassport() {
  return useQuery({
    queryKey: ['passport'],
    queryFn: async () => (await api.get<SkillPassport>('/students/me/passport')).data,
  });
}

export function usePublicPassport(studentId: string | undefined) {
  return useQuery({
    queryKey: ['passport', 'public', studentId],
    queryFn: async () => (await api.get<SkillPassport>(`/students/${studentId}/passport`)).data,
    enabled: Boolean(studentId),
  });
}

export function useProgress() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: async () => (await api.get<ProgressSummary>('/students/me/progress')).data,
  });
}

export function useActivity(days = 140) {
  return useQuery({
    queryKey: ['activity', days],
    queryFn: async () =>
      (await api.get<ActivityCalendar>('/students/me/activity', { params: { days } })).data,
  });
}

// --- Интеграции -------------------------------------------------------------

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => (await api.get<IntegrationSummary[]>('/integrations')).data,
  });
}

export function useConnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { provider: IntegrationProvider; username: string }) =>
      (await api.post(`/integrations/${payload.provider.toLowerCase()}/connect`, { username: payload.username })).data,
    onSuccess: () => invalidateProgress(qc),
  });
}

export function useSyncIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (provider: IntegrationProvider) =>
      (await api.post(`/integrations/${provider.toLowerCase()}/sync`)).data,
    onSuccess: () => invalidateProgress(qc),
  });
}

export function useDisconnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (provider: IntegrationProvider) =>
      (await api.delete(`/integrations/${provider.toLowerCase()}`)).data,
    onSuccess: () => invalidateProgress(qc),
  });
}

// --- Геймификация -----------------------------------------------------------

export function useLeaderboard(specialization?: SkillCategory) {
  return useQuery({
    queryKey: ['leaderboard', specialization ?? 'all'],
    queryFn: async () =>
      (await api.get<LeaderboardEntry[]>('/gamification/leaderboard', {
        params: specialization ? { specialization } : {},
      })).data,
  });
}

export function useMyBadges() {
  return useQuery({
    queryKey: ['badges', 'me'],
    queryFn: async () =>
      (await api.get<{ badge: PassportBadge; awardedAt: string }[]>('/badges/me')).data,
  });
}

export function useBadgeCatalog() {
  return useQuery({
    queryKey: ['badges', 'catalog'],
    queryFn: async () => (await api.get<BadgeCatalogItem[]>('/badges')).data,
    staleTime: Infinity,
  });
}

// --- Цели -------------------------------------------------------------------

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => (await api.get<Goal[]>('/goals')).data,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Goal>) => (await api.post<Goal>('/goals', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: Partial<Goal> }) =>
      (await api.patch<Goal>(`/goals/${payload.id}`, payload.data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/goals/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

// --- Привычки ---------------------------------------------------------------

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => (await api.get<Habit[]>('/habits')).data,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Habit>) => (await api.post<Habit>('/habits', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useCheckinHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (habitId: string) =>
      (await api.post(`/habits/${habitId}/checkin`, {})).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      invalidateProgress(qc);
    },
  });
}

export function useArchiveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/habits/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

// --- Гильдии и дуэли --------------------------------------------------------

export function useGuilds() {
  return useQuery({
    queryKey: ['guilds'],
    queryFn: async () => (await api.get<Guild[]>('/guilds')).data,
  });
}

export function useMyGuild() {
  return useQuery({
    queryKey: ['guild', 'me'],
    queryFn: async () => (await api.get<{ guildId: string | null }>('/guilds/me')).data,
  });
}

export function useJoinGuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (guildId: string) => (await api.post(`/guilds/${guildId}/join`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guilds'] });
      qc.invalidateQueries({ queryKey: ['guild', 'me'] });
    },
  });
}

export function useLeaveGuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.delete('/guilds/me')).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guilds'] });
      qc.invalidateQueries({ queryKey: ['guild', 'me'] });
    },
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: async () => (await api.get<Duel[]>('/challenges')).data,
  });
}

export function useRespondDuel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; accept: boolean }) =>
      (await api.post(`/challenges/${payload.id}/respond`, { accept: payload.accept })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges'] }),
  });
}

export function useCreateDuel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      opponentId: string;
      metric: string;
      target: number;
      days: number;
    }) => (await api.post('/challenges/duel', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges'] }),
  });
}
