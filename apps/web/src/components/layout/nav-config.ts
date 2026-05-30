import {
  BookOpen,
  Briefcase,
  Building2,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Search,
  Send,
  Settings,
  User,
  Users,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const studentNav: NavItem[] = [
  { to: '/app', label: 'Главная', icon: LayoutDashboard, end: true },
  { to: '/app/vacancies', label: 'Поиск вакансий', icon: Search },
  { to: '/app/applications', label: 'Мои отклики', icon: Send },
  { to: '/app/profile', label: 'Профиль', icon: User },
  { to: '/app/career', label: 'Career Hub', icon: BookOpen },
  { to: '/app/messages', label: 'Сообщения', icon: MessageSquare },
  { to: '/app/settings', label: 'Настройки', icon: Settings },
];

export const companyNav: NavItem[] = [
  { to: '/app', label: 'Дашборд', icon: LayoutDashboard, end: true },
  { to: '/app/company/vacancies', label: 'Мои вакансии', icon: Briefcase },
  { to: '/app/candidates', label: 'Кандидаты', icon: Users },
  { to: '/app/messages', label: 'Сообщения', icon: MessageSquare },
  { to: '/app/company', label: 'Профиль компании', icon: Building2 },
  { to: '/app/settings', label: 'Настройки', icon: Settings },
];
