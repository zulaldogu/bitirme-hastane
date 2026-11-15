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

// Tarihler arayüz boyunca "YYYY-MM-DD" metni olarak taşınır (UTC, saat dilimi kayması yok).

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const addDays = (iso: string, n: number) => {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Yerel saate göre bugünün tarihi. */
export const todayIso = (): string => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
};

/** Tarihin ait olduğu haftanın Pazartesi'si (K25: dönem Pazartesi başlar). */
export const mondayOf = (iso: string) => addDays(iso, -((parse(iso).getUTCDay() + 6) % 7));

/** 0 = Pazartesi … 6 = Pazar */
export const weekdayIndex = (iso: string) => (parse(iso).getUTCDay() + 6) % 7;

export const shortWeekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const dayOfMonth = (iso: string) => parse(iso).getUTCDate();

const longDay = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'UTC' });
/** "3 Kasım Salı" */
export const longDate = (iso: string) => longDay.format(parse(iso));
