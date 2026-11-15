import { httpApi } from './http';
import * as data from './mockData';
import { generateMockSchedule } from './mockSchedule';
import type { Api, Nurse, Rules, Schedule } from './types';

export type * from './types';
export { ApiError } from './http';

const delay = <T,>(value: T, ms = 150) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));

/** YYYY-MM-DD için `count` günlük liste. */
export function periodDays(start: string, count = 14): string[] {
  const [y, m, d] = start.split('-').map(Number);
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10),
  );
}

// Sahte API: arka uç olmadan arayüz geliştirmek için (VITE_USE_MOCK=true).
// Veriler bellekte tutulur, sayfa yenilenince sıfırlanır.
let nurses: Nurse[] = data.nurses;
let rules: Rules = data.rules;
const schedules: Schedule[] = [];

const mockApi: Api = {
  getDepartment: () => delay(data.department),
  getShiftTypes: () => delay(data.shiftTypes),
  getNurses: () => delay(nurses),
  createNurse: (input) => {
    const nurse: Nurse = {
      id: `n${Date.now()}`,
      title: input.senior ? 'Kıdemli Hemşire' : 'Hemşire',
      departmentId: data.department.id,
      ...input,
    };
    nurses = [...nurses, nurse];
    return delay(nurse);
  },
  updateNurse: (id, input) => {
    nurses = nurses.map((n) =>
      n.id === id ? { ...n, ...input, title: input.senior ? 'Kıdemli Hemşire' : 'Hemşire' } : n,
    );
    return delay(nurses.find((n) => n.id === id)!);
  },
  deleteNurse: (id) => {
    nurses = nurses.filter((n) => n.id !== id);
    return delay(undefined);
  },
  getRules: () => delay(rules),
  updateRules: (update) => {
    rules = { ...rules, ...update };
    return delay(rules);
  },
  getSchedule: (start) => {
    const found = [...schedules].reverse().find((s) => !start || s.startDate === start);
    return found || start ? delay(found ?? null) : mockApi.generateSchedule(data.days[0]);
  },
  generateSchedule: (start) => {
    const days = periodDays(start);
    const schedule: Schedule = {
      status: 'feasible',
      startDate: start,
      days,
      assignments: generateMockSchedule(nurses, days, rules),
      solveSeconds: 0.9,
      nightGap: null,
      totalGap: null,
      createdAt: new Date().toISOString(),
      violations: [],
    };
    schedules.push(schedule);
    // Senkron çözümü (K17) taklit eder.
    return delay(schedule, 900);
  },
  getActivity: () => delay(data.activity),
};

export const api: Api = import.meta.env.VITE_USE_MOCK === 'true' ? mockApi : httpApi;
