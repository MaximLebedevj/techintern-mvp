import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

/** Применяет тему к <html> (класс .dark). */
export function applyTheme(theme: Theme): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggle: () => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const current = get().theme;
        const isDark = current === 'dark' || (current === 'system' && prefersDark);
        const next: Theme = isDark ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    { name: 'techintern-theme' },
  ),
);
