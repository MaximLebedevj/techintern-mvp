import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const numberFormatter = new Intl.NumberFormat('ru-RU');

/** «60 000 – 90 000 ₽», «от 60 000 ₽», «до 90 000 ₽» или «з/п не указана». */
export function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'з/п не указана';
  if (min && max) return `${numberFormatter.format(min)} – ${numberFormatter.format(max)} ₽`;
  if (min) return `от ${numberFormatter.format(min)} ₽`;
  return `до ${numberFormatter.format(max as number)} ₽`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(iso: string): string {
  return format(new Date(iso), 'd MMMM yyyy', { locale: ru });
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'd MMM, HH:mm', { locale: ru });
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ru });
}

/** Русская плюрализация: plural(5, ['отклик','отклика','откликов']). */
export function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export function pluralWithCount(n: number, forms: [string, string, string]): string {
  return `${formatNumber(n)} ${plural(n, forms)}`;
}
