import * as data from './mockData';
import { generateMockSchedule } from './mockSchedule';
import type { Api } from './types';

export type * from './types';

const delay = <T,>(value: T, ms = 150) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const mockApi: Api = {
  getDepartment: () => delay(data.department),
  getShiftTypes: () => delay(data.shiftTypes),
  getNurses: () => delay(data.nurses),
  getRules: () => delay(data.rules),
  getSchedule: (fairness) =>
    delay(
      {
        days: data.days,
        fairness,
        assignments: generateMockSchedule(data.nurses, data.days, data.rules, fairness),
        solveSeconds: fairness ? 1.24 : 0.41,
      },
      // Senkron çözümü (K17) taklit eder.
      900,
    ),
  getActivity: () => delay(data.activity),
};

// Gerçek API (ASP.NET Core) hazır olunca burada `httpApi` tanımlanır ve
// VITE_USE_MOCK=false ile seçilir. Ekranlar değişmez.
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
if (!useMock) console.warn('Gerçek API henüz yok, sahte veri kullanılıyor.');

export const api: Api = mockApi;
