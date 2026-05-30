import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { useConversations, useMessages, useSendMessage } from '@/hooks/use-conversations';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { Spinner } from '@/components/common/loading';
import { formatDateTime } from '@/lib/format';
import { cn, initials } from '@/lib/utils';
import type { Conversation } from '@/types/api';

export function MessagesPage() {
  const { user, isCompany } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId && conversations && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const otherParty = (c: Conversation) =>
    isCompany
      ? { name: c.student.fullName, avatar: c.student.avatarUrl }
      : { name: c.company.name, avatar: c.company.logoUrl };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Сообщения</h1>
        <EmptyState
          icon={MessageSquare}
          title="Пока нет диалогов"
          description={
            isCompany
              ? 'Напишите кандидату из откликов или со страницы профиля.'
              : 'Диалоги появятся, когда компания пригласит вас на собеседование.'
          }
        />
      </div>
    );
  }

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Сообщения</h1>

      <Card className="grid h-[calc(100vh-12rem)] overflow-hidden lg:grid-cols-[320px_1fr]">
        {/* Список диалогов */}
        <div
          className={cn(
            'flex-col border-r border-border lg:flex',
            active && 'hidden lg:flex',
          )}
        >
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => {
              const party = otherParty(c);
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-border p-4 text-left transition-colors hover:bg-muted/50',
                    activeId === c.id && 'bg-accent',
                  )}
                >
                  <Avatar>
                    {party.avatar && <AvatarImage src={party.avatar} alt={party.name} />}
                    <AvatarFallback>{initials(party.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{party.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {c.lastMessage?.body ?? 'Нет сообщений'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Активный диалог */}
        <div className={cn('flex-col', active ? 'flex' : 'hidden lg:flex')}>
          {active && user ? (
            <ChatThread
              key={active.id}
              conversation={active}
              currentUserId={user.id}
              title={otherParty(active).name}
              onBack={() => setActiveId(null)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Выберите диалог
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ChatThread({
  conversation,
  currentUserId,
  title,
  onBack,
}: {
  conversation: Conversation;
  currentUserId: string;
  title: string;
  onBack: () => void;
}) {
  const { data: messages } = useMessages(conversation.id);
  const send = useSendMessage();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await send.mutateAsync({ conversationId: conversation.id, body });
    } catch {
      setText(body);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="font-semibold">{title}</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages?.map((message) => {
          const mine = message.senderUserId === currentUserId;
          return (
            <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                  mine
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-muted text-foreground',
                )}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={cn('mt-1 text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {formatDateTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          placeholder="Напишите сообщение…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" variant="gradient" size="icon" disabled={!text.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </>
  );
}
