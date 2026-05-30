import { lazy } from 'react';
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

// Экраны приложения — lazy (code-split по маршрутам, см. CLAUDE.md §7).
const DashboardPage = lazy(() => import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })));
const VacanciesPage = lazy(() =>
  import('@/pages/vacancies/vacancies-list').then((m) => ({ default: m.VacanciesPage })),
);
const VacancyDetailPage = lazy(() =>
  import('@/pages/vacancies/vacancy-detail').then((m) => ({ default: m.VacancyDetailPage })),
);
const ApplicationsPage = lazy(() =>
  import('@/pages/student/applications').then((m) => ({ default: m.ApplicationsPage })),
);
const StudentProfilePage = lazy(() =>
  import('@/pages/student/profile').then((m) => ({ default: m.StudentProfilePage })),
);
const CareerHubPage = lazy(() =>
  import('@/pages/career/career-hub').then((m) => ({ default: m.CareerHubPage })),
);
const CareerResourcePage = lazy(() =>
  import('@/pages/career/career-resource').then((m) => ({ default: m.CareerResourcePage })),
);
const MessagesPage = lazy(() => import('@/pages/messages').then((m) => ({ default: m.MessagesPage })));
const SettingsPage = lazy(() => import('@/pages/settings').then((m) => ({ default: m.SettingsPage })));
const CompanyProfilePage = lazy(() =>
  import('@/pages/company/company-profile').then((m) => ({ default: m.CompanyProfilePage })),
);
const CompanyVacanciesPage = lazy(() =>
  import('@/pages/company/company-vacancies').then((m) => ({ default: m.CompanyVacanciesPage })),
);
const PostVacancyPage = lazy(() =>
  import('@/pages/company/post-vacancy').then((m) => ({ default: m.PostVacancyPage })),
);
const VacancyApplicantsPage = lazy(() =>
  import('@/pages/company/vacancy-applicants').then((m) => ({ default: m.VacancyApplicantsPage })),
);
const CandidatesPage = lazy(() =>
  import('@/pages/company/candidates-list').then((m) => ({ default: m.CandidatesPage })),
);
const CandidateDetailPage = lazy(() =>
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
