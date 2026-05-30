import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type {
  CandidateCard,
  CareerResource,
  Paginated,
  Project,
  Skill,
  SkillNode,
  SkillTreeResponse,
  StudentProfile,
  Vacancy,
} from '@/types/api';

// --- Профиль студента -------------------------------------------------------

export function useMyStudentProfile() {
  return useQuery({
    queryKey: ['student', 'me'],
    queryFn: async () => (await api.get<StudentProfile>('/students/me')).data,
  });
}

export function useUpdateStudentProfile() {
  const qc = useQueryClient();
  const refreshSession = useAuthStore((s) => s.refreshSession);
  return useMutation({
    mutationFn: async (payload: Partial<StudentProfile>) =>
      (await api.patch<StudentProfile>('/students/me', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student'] });
      void refreshSession();
    },
  });
}

// --- Skill Tree -------------------------------------------------------------

export function useSkillTree() {
  return useQuery({
    queryKey: ['student', 'skill-tree'],
    queryFn: async () => (await api.get<SkillTreeResponse>('/students/me/skill-tree')).data,
  });
}

export function useSetSkills() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (skills: { skillId: string; progress: number }[]) =>
      (await api.put<SkillTreeResponse>('/students/me/skills', { skills })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student'] });
    },
  });
}

export interface RecommendationsResponse {
  skill: Skill | null;
  vacancies: Vacancy[];
  resources: CareerResource[];
}

export function useRecommendations(skillSlug?: string) {
  return useQuery({
    queryKey: ['student', 'recommendations', skillSlug ?? 'general'],
    queryFn: async () =>
      (
        await api.get<RecommendationsResponse>('/students/me/recommendations', {
          params: skillSlug ? { skill: skillSlug } : {},
        })
      ).data,
  });
}

// --- Проекты ----------------------------------------------------------------

export function useAddProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      technologies: string[];
      role?: string;
      url?: string;
      githubUrl?: string;
    }) => (await api.post<Project>('/students/me/projects', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', 'me'] }),
  });
}

export function useRemoveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/students/me/projects/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', 'me'] }),
  });
}

// --- Каталог навыков --------------------------------------------------------

export function useSkillCatalog() {
  return useQuery({
    queryKey: ['skills', 'flat'],
    queryFn: async () => (await api.get<Skill[]>('/skills')).data,
    staleTime: 10 * 60_000,
  });
}

export function useSkillCatalogTree() {
  return useQuery({
    queryKey: ['skills', 'tree'],
    queryFn: async () => (await api.get<SkillNode[]>('/skills/tree')).data,
    staleTime: 10 * 60_000,
  });
}

// --- Кандидаты (для компании) ----------------------------------------------

export interface CandidateFilters {
  vacancyId?: string;
  q?: string;
  specialization?: string;
  page?: number;
  limit?: number;
}

export function useCandidates(filters: CandidateFilters) {
  return useQuery({
    queryKey: ['candidates', filters],
    queryFn: async () =>
      (await api.get<Paginated<CandidateCard>>('/students', { params: filters })).data,
    placeholderData: keepPreviousData,
  });
}

export function useCandidate(id: string | undefined) {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => (await api.get<StudentProfile>(`/students/${id}`)).data,
    enabled: Boolean(id),
  });
}
