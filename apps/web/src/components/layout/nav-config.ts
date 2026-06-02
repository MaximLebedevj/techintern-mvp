import {
  BookOpen,
  Briefcase,
  Building2,
  IdCard,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Search,
  Send,
  Settings,
  Swords,
  Target,
  TrendingUp,
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
  { to: '/app/passport', label: 'Паспорт навыков', icon: IdCard },
  { to: '/app/progress', label: 'Мой прогресс', icon: TrendingUp },
  { to: '/app/goals', label: 'Цели и привычки', icon: Target },
  { to: '/app/challenges', label: 'Челленджи', icon: Swords },
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
