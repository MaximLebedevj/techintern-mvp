import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Application, ApplicationStatus } from '@/types/api';

export function useMyApplications() {
  return useQuery({
    queryKey: ['applications', 'me'],
    queryFn: async () => (await api.get<Application[]>('/applications/me')).data,
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: async () => (await api.get<Application>(`/applications/${id}`)).data,
    enabled: Boolean(id),
  });
}

/** Компания меняет статус отклика (двигает трекер). */
export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; status: ApplicationStatus; note?: string }) =>
      (
        await api.patch<Application>(`/applications/${payload.id}/status`, {
          status: payload.status,
          note: payload.note,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicants'] });
      qc.invalidateQueries({ queryKey: ['company', 'stats'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useWithdrawApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/applications/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}
