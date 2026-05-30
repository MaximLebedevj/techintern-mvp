import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Application, Paginated, Vacancy } from '@/types/api';

export interface VacancyFilters {
  q?: string;
  skills?: string[];
  city?: string;
  workFormat?: string;
  employmentType?: string;
  level?: string;
  salaryMin?: number;
  sort?: 'recent' | 'salary';
  page?: number;
  limit?: number;
}

function buildParams(filters: VacancyFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  filters.skills?.forEach((s) => params.append('skills', s));
  if (filters.city) params.set('city', filters.city);
  if (filters.workFormat) params.set('workFormat', filters.workFormat);
  if (filters.employmentType) params.set('employmentType', filters.employmentType);
  if (filters.level) params.set('level', filters.level);
  if (filters.salaryMin) params.set('salaryMin', String(filters.salaryMin));
  if (filters.sort) params.set('sort', filters.sort);
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 12));
  return params;
}

export function useVacancies(filters: VacancyFilters) {
  return useQuery({
    queryKey: ['vacancies', filters],
    queryFn: async () =>
      (await api.get<Paginated<Vacancy>>('/vacancies', { params: buildParams(filters) })).data,
    placeholderData: keepPreviousData,
  });
}

export function useVacancy(id: string | undefined) {
  return useQuery({
    queryKey: ['vacancy', id],
    queryFn: async () => (await api.get<Vacancy>(`/vacancies/${id}`)).data,
    enabled: Boolean(id),
  });
}

/** Студент откликается на вакансию. */
export function useApplyToVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { vacancyId: string; coverLetter?: string }) =>
      (await api.post<Application>('/applications', payload)).data,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['vacancy', variables.vacancyId] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
