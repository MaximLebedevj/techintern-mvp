import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Conversation, Message } from '@/types/api';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => (await api.get<Conversation[]>('/conversations')).data,
    refetchInterval: 20_000,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: async () =>
      (await api.get<Message[]>(`/conversations/${conversationId}/messages`)).data,
    enabled: Boolean(conversationId),
    refetchInterval: 8_000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { conversationId: string; body: string }) =>
      (await api.post<Message>(`/conversations/${payload.conversationId}/messages`, {
        body: payload.body,
      })).data,
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ['conversations', variables.conversationId, 'messages'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { studentId?: string; companyId?: string }) =>
      (await api.post<Conversation>('/conversations', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}
