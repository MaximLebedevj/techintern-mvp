import { useOAuthProviders } from '@/hooks/use-auth';
import { oauthUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';

/** Кнопки входа через OAuth. Показываются только для настроенных провайдеров. */
export function OAuthButtons() {
  const { data } = useOAuthProviders();
  if (!data || (!data.google && !data.github)) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        {data.google && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => (window.location.href = oauthUrl('google'))}
          >
            <GoogleIcon />
            Google
          </Button>
        )}
        {data.github && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => (window.location.href = oauthUrl('github'))}
          >
            <GithubIcon />
            GitHub
          </Button>
        )}
      </div>
      <div className="relative py-1 text-center">
        <span className="relative z-10 bg-background px-3 text-xs text-muted-foreground">
          или по email
        </span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current">
      <path d="M12 1a11 11 0 0 0-3.48 21.44c.55.1.75-.24.75-.53v-1.86c-3.06.67-3.71-1.47-3.71-1.47-.5-1.27-1.22-1.61-1.22-1.61-1-.68.07-.67.07-.67 1.11.08 1.69 1.14 1.69 1.14.98 1.68 2.58 1.2 3.21.92.1-.71.39-1.2.7-1.48-2.44-.28-5.01-1.22-5.01-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .92-.3 3.02 1.13a10.5 10.5 0 0 1 5.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.22-2.58 5.15-5.03 5.42.4.34.75 1.01.75 2.04v3.03c0 .29.2.64.76.53A11 11 0 0 0 12 1Z" />
    </svg>
  );
}
