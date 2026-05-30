import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/lib/query-client';
import { router } from '@/routes/router';
import { useAuthStore } from '@/stores/auth-store';
import { applyTheme, useThemeStore } from '@/stores/theme-store';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const theme = useThemeStore((s) => s.theme);

  // Восстанавливаем сессию один раз при старте.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Применяем тему и реагируем на смену системной темы.
  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => theme === 'system' && applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} />
        <Toaster
          position="top-center"
          theme={theme}
          richColors
          toastOptions={{ className: 'rounded-xl' }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
