import type { Api } from './types';

// Gerçek API (backend/src/Api). Vite, /api isteklerini http://localhost:5249'a yönlendirir.

export class ApiError extends Error {}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Sunucuya ulaşılamadı. API çalışıyor mu? (dotnet run --project backend/src/Api)');
  }
  if (res.status === 204) return null as T;
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error ?? `İstek başarısız (${res.status}).`);
  }
  return res.json() as Promise<T>;
}

export const httpApi: Api = {
  getDepartment: () => request('GET', '/department'),
  getShiftTypes: () => request('GET', '/shift-types'),
  getNurses: () => request('GET', '/nurses'),
  createNurse: (input) => request('POST', '/nurses', input),
  updateNurse: (id, input) => request('PUT', `/nurses/${encodeURIComponent(id)}`, input),
  deleteNurse: (id) => request('DELETE', `/nurses/${encodeURIComponent(id)}`),
  getRules: () => request('GET', '/rules'),
  updateRules: (update) => request('PUT', '/rules', update),
  getSchedule: (start) => request('GET', start ? `/schedule?start=${start}` : '/schedule'),
  generateSchedule: (start) => request('POST', '/schedule', { startDate: start }),
  getActivity: () => request('GET', '/activity'),
};
