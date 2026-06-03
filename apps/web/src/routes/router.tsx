import { lazy, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { ProtectedRoute } from './protected-route';
import { RoleRoute } from './role-route';

// Публичные/входные экраны — eager (нужны при первой отрисовке).
import { LandingPage } from '@/pages/landing';
import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { OAuthCallbackPage } from '@/pages/auth/oauth-callback';
import { NotFoundPage } from '@/pages/not-found';

/**
 * Ленивая загрузка с авто-перезагрузкой при ошибке загрузки чанка.
 * После редеплоя устаревший index.html ссылается на исчезнувшие чанки
 * («Failed to fetch dynamically imported module») — один раз перезагружаем
 * страницу, чтобы получить свежий index.html (флаг защищает от зацикливания).
 */
function lazyWithRetry<T extends ComponentType<unknown>>(factory: () => Promise<{ default: T }>) {
  return lazy<T>(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem('ti-chunk-reloaded');
      return mod;
    } catch (err) {
      if (!sessionStorage.getItem('ti-chunk-reloaded')) {
        sessionStorage.setItem('ti-chunk-reloaded', '1');
        window.location.reload();
        return new Promise<never>(() => {}); // зависаем до перезагрузки страницы
      }
      throw err;
    }
  });
}

// Экраны приложения — lazy (code-split по маршрутам, см. CLAUDE.md §7).
const DashboardPage = lazyWithRetry(() => import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })));
const VacanciesPage = lazyWithRetry(() =>
  import('@/pages/vacancies/vacancies-list').then((m) => ({ default: m.VacanciesPage })),
);
const VacancyDetailPage = lazyWithRetry(() =>
  import('@/pages/vacancies/vacancy-detail').then((m) => ({ default: m.VacancyDetailPage })),
);
const ApplicationsPage = lazyWithRetry(() =>
  import('@/pages/student/applications').then((m) => ({ default: m.ApplicationsPage })),
);
const StudentProfilePage = lazyWithRetry(() =>
  import('@/pages/student/profile').then((m) => ({ default: m.StudentProfilePage })),
);
const PassportPage = lazyWithRetry(() => import('@/pages/student/passport').then((m) => ({ default: m.PassportPage })));
const ProgressPage = lazyWithRetry(() => import('@/pages/student/progress').then((m) => ({ default: m.ProgressPage })));
const GoalsHabitsPage = lazyWithRetry(() =>
  import('@/pages/student/goals-habits').then((m) => ({ default: m.GoalsHabitsPage })),
);
const ChallengesPage = lazyWithRetry(() => import('@/pages/challenges').then((m) => ({ default: m.ChallengesPage })));
const CareerHubPage = lazyWithRetry(() =>
  import('@/pages/career/career-hub').then((m) => ({ default: m.CareerHubPage })),
);
const CareerResourcePage = lazyWithRetry(() =>
  import('@/pages/career/career-resource').then((m) => ({ default: m.CareerResourcePage })),
);
const MessagesPage = lazyWithRetry(() => import('@/pages/messages').then((m) => ({ default: m.MessagesPage })));
const SettingsPage = lazyWithRetry(() => import('@/pages/settings').then((m) => ({ default: m.SettingsPage })));
const CompanyProfilePage = lazyWithRetry(() =>
  import('@/pages/company/company-profile').then((m) => ({ default: m.CompanyProfilePage })),
);
const CompanyVacanciesPage = lazyWithRetry(() =>
  import('@/pages/company/company-vacancies').then((m) => ({ default: m.CompanyVacanciesPage })),
);
const PostVacancyPage = lazyWithRetry(() =>
  import('@/pages/company/post-vacancy').then((m) => ({ default: m.PostVacancyPage })),
);
const VacancyApplicantsPage = lazyWithRetry(() =>
  import('@/pages/company/vacancy-applicants').then((m) => ({ default: m.VacancyApplicantsPage })),
);
const CandidatesPage = lazyWithRetry(() =>
  import('@/pages/company/candidates-list').then((m) => ({ default: m.CandidatesPage })),
);
const CandidateDetailPage = lazyWithRetry(() =>
  import('@/pages/company/candidate-detail').then((m) => ({ default: m.CandidateDetailPage })),
);

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/auth/callback', element: <OAuthCallbackPage /> },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'vacancies', element: <VacanciesPage /> },
      { path: 'vacancies/:id', element: <VacancyDetailPage /> },
      { path: 'career', element: <CareerHubPage /> },
      { path: 'career/:slug', element: <CareerResourcePage /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'settings', element: <SettingsPage /> },

      // Только для студентов
      {
        element: <RoleRoute allow={['STUDENT']} />,
        children: [
          { path: 'applications', element: <ApplicationsPage /> },
          { path: 'profile', element: <StudentProfilePage /> },
          { path: 'passport', element: <PassportPage /> },
          { path: 'progress', element: <ProgressPage /> },
          { path: 'goals', element: <GoalsHabitsPage /> },
          { path: 'challenges', element: <ChallengesPage /> },
        ],
      },

      // Только для компаний
      {
        element: <RoleRoute allow={['COMPANY']} />,
        children: [
          { path: 'company', element: <CompanyProfilePage /> },
          { path: 'company/vacancies', element: <CompanyVacanciesPage /> },
          { path: 'company/vacancies/new', element: <PostVacancyPage /> },
          { path: 'company/vacancies/:id/edit', element: <PostVacancyPage /> },
          { path: 'company/vacancies/:id/applicants', element: <VacancyApplicantsPage /> },
          { path: 'candidates', element: <CandidatesPage /> },
          { path: 'candidates/:id', element: <CandidateDetailPage /> },
        ],
      },
    ],
  },
  { path: '/404', element: <NotFoundPage /> },
  { path: '*', element: <Navigate to="/404" replace /> },
]);
