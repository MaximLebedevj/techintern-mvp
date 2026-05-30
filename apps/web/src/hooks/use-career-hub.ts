import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CareerProgress, CareerResource, ResourceType } from '@/types/api';

export interface ResourceFilters {
  type?: ResourceType;
  category?: string;
  tag?: string;
  q?: string;
}

export function useCareerResources(filters: ResourceFilters = {}) {
  return useQuery({
    queryKey: ['career-hub', filters],
    queryFn: async () =>
      (await api.get<CareerResource[]>('/career-hub', { params: filters })).data,
  });
}

export function useCareerResource(slug: string | undefined) {
  return useQuery({
    queryKey: ['career-hub', 'resource', slug],
    queryFn: async () => (await api.get<CareerResource>(`/career-hub/${slug}`)).data,
    enabled: Boolean(slug),
  });
}

export function useCareerProgress(enabled: boolean) {
  return useQuery({
    queryKey: ['career-hub', 'progress'],
    queryFn: async () => (await api.get<CareerProgress>('/career-hub/me/progress')).data,
    enabled,
  });
}

export function useCompleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/career-hub/${id}/complete`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['career-hub', 'progress'] }),
  });
}
