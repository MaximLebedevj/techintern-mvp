import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { LoadingScreen } from '@/components/common/loading';

/** Пускает только аутентифицированных. Пока сессия восстанавливается — лоадер. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <LoadingScreen />;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
