import { useState } from 'react';
import { CheckCircle2, Github, Loader2, RefreshCw, Swords, Unplug } from 'lucide-react';
import { toast } from 'sonner';
import {
  useConnectIntegration,
  useDisconnectIntegration,
  useIntegrations,
  useSyncIntegration,
} from '@/hooks/use-skillproof';
import type { IntegrationProvider, IntegrationSummary } from '@/types/skillproof';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api';
import { formatRelative } from '@/lib/format';

const PROVIDERS: { provider: IntegrationProvider; label: string; icon: typeof Github; hint: string }[] = [
  { provider: 'GITHUB', label: 'GitHub', icon: Github, hint: 'Коммиты, PR, репозитории, языки' },
  { provider: 'CODEWARS', label: 'Codewars', icon: Swords, hint: 'Решённые задачи, honor, ранг' },
];

export function IntegrationsPanel() {
  const { data: integrations } = useIntegrations();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PROVIDERS.map((p) => (
        <IntegrationCard
          key={p.provider}
          provider={p.provider}
          label={p.label}
          icon={p.icon}
          hint={p.hint}
          integration={integrations?.find((i) => i.provider === p.provider)}
        />
      ))}
    </div>
  );
}

function IntegrationCard({
  provider,
  label,
  icon: Icon,
  hint,
  integration,
}: {
  provider: IntegrationProvider;
  label: string;
  icon: typeof Github;
  hint: string;
  integration?: IntegrationSummary;
}) {
  const [username, setUsername] = useState('');
  const connect = useConnectIntegration();
  const sync = useSyncIntegration();
  const disconnect = useDisconnectIntegration();
  const connected = integration?.status === 'CONNECTED';

  const handleConnect = async () => {
    if (!username.trim()) return;
    try {
      await connect.mutateAsync({ provider, username: username.trim() });
      toast.success(`${label} подключён и синхронизирован`);
      setUsername('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Не удалось подключить ${label}`));
    }
  };

  const handleSync = async () => {
    try {
      await sync.mutateAsync(provider);
      toast.success(`${label} обновлён`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не удалось синхронизировать'));
    }
  };

  const stat = (key: string): number | string =>
    (integration?.stats?.[key] as number | string | undefined) ?? '—';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
        {connected && <CheckCircle2 className="size-5 text-success" />}
      </div>

      {connected ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Аккаунт:</span>{' '}
            <span className="font-medium">@{integration?.username}</span>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {provider === 'GITHUB' ? (
              <>
                <span>Коммиты: <b className="text-foreground">{stat('commits')}</b></span>
                <span>Звёзды: <b className="text-foreground">{stat('stars')}</b></span>
                <span>Репозитории: <b className="text-foreground">{stat('repos')}</b></span>
              </>
            ) : (
              <>
                <span>Задачи: <b className="text-foreground">{stat('solved')}</b></span>
                <span>Honor: <b className="text-foreground">{stat('honor')}</b></span>
                <span>Ранг: <b className="text-foreground">{stat('rank')}</b></span>
              </>
            )}
          </div>
          {integration?.lastSyncedAt && (
            <p className="text-xs text-muted-foreground">
              Обновлено {formatRelative(integration.lastSyncedAt)}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={sync.isPending}>
              {sync.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Синхронизировать
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => disconnect.mutate(provider)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Unplug className="size-3.5" />
              Отключить
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Input
            placeholder={`Логин на ${label}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />
          <Button variant="gradient" onClick={handleConnect} disabled={connect.isPending || !username.trim()}>
            {connect.isPending && <Loader2 className="size-4 animate-spin" />}
            Подключить
          </Button>
        </div>
      )}
    </Card>
  );
}
