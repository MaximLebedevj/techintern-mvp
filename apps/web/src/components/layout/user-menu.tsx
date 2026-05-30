import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { initials } from '@/lib/utils';

export function UserMenu() {
  const { user, logout, isStudent } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const name = user.student?.fullName ?? user.company?.name ?? user.email;
  const avatarUrl = user.student?.avatarUrl ?? user.company?.logoUrl ?? undefined;

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из аккаунта');
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-0.5 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="size-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(isStudent ? '/app/profile' : '/app/company')}>
          <User className="size-4" />
          {isStudent ? 'Мой профиль' : 'Профиль компании'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/app/settings')}>
          <Settings className="size-4" />
          Настройки
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
