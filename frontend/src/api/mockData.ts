import type { ActivityEvent, Department, Nurse, Rules, ShiftType } from './types';

// K12'deki örnek veri: 12 hemşire (5'i kıdemli), 14 gün, ihtiyaç S3/A2/G2.
// Tüm isimler sentetiktir.

export const department: Department = { id: 'dahiliye', name: 'Dahiliye Servisi' };

export const shiftTypes: ShiftType[] = [
  { code: 'S', name: 'Sabah', start: '08:00', end: '16:00' },
  { code: 'A', name: 'Akşam', start: '16:00', end: '24:00' },
  { code: 'G', name: 'Gece', start: '00:00', end: '08:00' },
];

export const rules: Rules = {
  minStaff: { S: 3, A: 2, G: 2 },
  maxShiftsPerWeek: 5,
  minSeniorPerShift: 1,
  forbiddenSuccessions: [
    { from: 'G', to: 'S' },
    { from: 'G', to: 'A' },
    { from: 'A', to: 'S' },
  ],
  nightShift: 'G',
};

/** 2–15 Kasım 2026: Pazartesi başlayan iki takvim haftası. */
export const days: string[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 10, 2 + i));
  return d.toISOString().slice(0, 10);
});

const nurse = (
  id: string,
  name: string,
  senior: boolean,
  leaveDays: string[] = [],
): Nurse => ({
  id,
  name,
  title: senior ? 'Kıdemli Hemşire' : 'Hemşire',
  senior,
  departmentId: department.id,
  leaveDays,
});

export const nurses: Nurse[] = [
  nurse('n1', 'Ayşe Kaya', true, ['2026-11-07', '2026-11-08']),
  nurse('n2', 'Elif Demir', true),
  nurse('n3', 'Zeynep Arslan', true),
  nurse('n4', 'Fatma Yıldız', true),
  nurse('n5', 'Merve Tekin', true),
  nurse('n6', 'Selin Bulut', false, ['2026-11-11']),
  nurse('n7', 'Büşra Çelik', false),
  nurse('n8', 'Esra Nas', false),
  nurse('n9', 'Derya Öztürk', false, ['2026-11-04', '2026-11-05']),
  nurse('n10', 'Gamze Sarı', false),
  nurse('n11', 'Hatice Uysal', false),
  nurse('n12', 'Seda Polat', false),
];

export const activity: ActivityEvent[] = [
  {
    id: 'e1',
    kind: 'leave-request',
    title: 'Gamze Sarı · izin talebi',
    subtitle: '13 Kasım Cuma · onay bekliyor',
  },
  {
    id: 'e2',
    kind: 'success',
    title: 'Tüm sert kısıtlar sağlandı',
    subtitle: '6 kural · 0 ihlal',
  },
  {
    id: 'e3',
    kind: 'info',
    title: 'Çizelge oluşturuldu',
    subtitle: 'Bugün, 09:12',
  },
  {
    id: 'e4',
    kind: 'leave',
    title: 'Ayşe Kaya izinli',
    subtitle: '7–8 Kasım',
  },
  {
    id: 'e5',
    kind: 'leave',
    title: 'Derya Öztürk izinli',
    subtitle: '4–5 Kasım',
  },
];
