import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Объединение Tailwind-классов с разрешением конфликтов. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Инициалы для аватара-заглушки. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Простая задержка (для UX-демо). */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
