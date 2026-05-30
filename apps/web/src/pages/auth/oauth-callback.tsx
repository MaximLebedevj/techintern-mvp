import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { setAccessToken } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingScreen } from '@/components/common/loading';

/** Принимает access-токен из фрагмента URL после OAuth и завершает вход. */
export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const hash = window.location.hash.replace(/^#/, '');
    const token = new URLSearchParams(hash).get('token');

    const finish = async () => {
      if (token) setAccessToken(token);
      await bootstrap();
      const { status } = useAuthStore.getState();
      if (status === 'authenticated') {
        toast.success('Вход выполнен');
        navigate('/app', { replace: true });
      } else {
        toast.error('Не удалось завершить вход');
        navigate('/login', { replace: true });
      }
    };
    void finish();
  }, [bootstrap, navigate]);

  return <LoadingScreen />;
}
