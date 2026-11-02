// Türkçe sayı ve tarih biçimleri.

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const dayMonth = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const year = new Intl.DateTimeFormat('tr-TR', { year: 'numeric', timeZone: 'UTC' });

/** "2–15 Kasım 2026" */
export function periodLabel(days: string[]): string {
  const first = new Date(days[0]);
  const last = new Date(days[days.length - 1]);
  const a = dayMonth.format(first);
  const b = dayMonth.format(last);
  const sameMonth = first.getUTCMonth() === last.getUTCMonth();
  return `${sameMonth ? first.getUTCDate() : a}–${b} ${year.format(last)}`;
}
