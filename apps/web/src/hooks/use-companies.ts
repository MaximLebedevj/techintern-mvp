import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Application, CompanyProfile, CompanyStats, Vacancy } from '@/types/api';
import type { VacancyFormValues } from '@/lib/schemas';

export function useMyCompany() {
  return useQuery({
    queryKey: ['company', 'me'],
    queryFn: async () => (await api.get<CompanyProfile>('/companies/me')).data,
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  const refreshSession = useAuthStore((s) => s.refreshSession);
  return useMutation({
    mutationFn: async (payload: Partial<CompanyProfile>) =>
      (await api.patch<CompanyProfile>('/companies/me', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company'] });
      void refreshSession();
    },
  });
}

export function useMyVacancies() {
  return useQuery({
    queryKey: ['company', 'vacancies'],
    queryFn: async () => (await api.get<Vacancy[]>('/companies/me/vacancies')).data,
  });
}

export function useCompanyStats() {
  return useQuery({
    queryKey: ['company', 'stats'],
    queryFn: async () => (await api.get<CompanyStats>('/companies/me/stats')).data,
  });
}

export function useApplicants(vacancyId: string | undefined) {
  return useQuery({
    queryKey: ['applicants', vacancyId],
    queryFn: async () => (await api.get<Application[]>(`/vacancies/${vacancyId}/applicants`)).data,
    enabled: Boolean(vacancyId),
  });
}

export function useCreateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: VacancyFormValues) =>
      (await api.post<Vacancy>('/vacancies', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', 'vacancies'] });
      qc.invalidateQueries({ queryKey: ['vacancies'] });
    },
  });
}

export function useUpdateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: VacancyFormValues }) =>
      (await api.patch<Vacancy>(`/vacancies/${payload.id}`, payload.data)).data,
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ['company', 'vacancies'] });
      qc.invalidateQueries({ queryKey: ['vacancy', variables.id] });
    },
  });
}

export function useDeleteVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/vacancies/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', 'vacancies'] });
      qc.invalidateQueries({ queryKey: ['vacancies'] });
    },
  });
}
