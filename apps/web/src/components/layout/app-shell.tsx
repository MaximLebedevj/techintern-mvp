import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/common/loading';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { companyNav, studentNav } from './nav-config';

export function AppShell() {
  const { isStudent } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const items = isStudent ? studentNav : companyNav;

  // Закрываем мобильное меню при смене маршрута.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Десктоп-сайдбар */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border lg:block">
        <Sidebar items={items} isStudent={isStudent} />
      </aside>

      {/* Мобильный drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute inset-y-0 left-0 w-64 border-r border-border shadow-card-hover"
            >
              <Sidebar
                items={items}
                isStudent={isStudent}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center">
                <Spinner />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
