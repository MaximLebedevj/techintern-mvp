import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/types/api';

/** Ограничивает группу маршрутов по роли. Иначе — на главную приложения. */
export function RoleRoute({ allow }: { allow: Role[] }) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}
