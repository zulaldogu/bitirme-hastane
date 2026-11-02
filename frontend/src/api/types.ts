// Arayüzün API ile konuştuğu tipler. Sahte (mock) ve gerçek uygulama aynı
// tipleri döndürür; ekranlar yalnızca bunları bilir.

/** S = Sabah 08–16, A = Akşam 16–24, G = Gece 00–08 (K7). */
export type ShiftCode = 'S' | 'A' | 'G';

export interface ShiftType {
  code: ShiftCode;
  name: string;
  start: string; // "08:00"
  end: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Nurse {
  id: string;
  name: string;
  title: string;
  senior: boolean;
  departmentId: string;
  /** İzinli günler, "YYYY-MM-DD". */
  leaveDays: string[];
}

export interface Rules {
  /** Her gün, her vardiyada bulunması gereken en az kişi. */
  minStaff: Record<ShiftCode, number>;
  /** Takvim haftası (Pzt–Paz) başına en fazla vardiya. */
  maxShiftsPerWeek: number;
}

export interface Assignment {
  nurseId: string;
  date: string;
  shift: ShiftCode;
}

export interface Schedule {
  /** Dönemin günleri, sırayla. */
  days: string[];
  /** Adil gece dağılımı amacı açık mıydı (K10). */
  fairness: boolean;
  assignments: Assignment[];
  solveSeconds: number;
}

export type ActivityKind = 'leave-request' | 'success' | 'info' | 'leave';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
}

export interface Api {
  getDepartment(): Promise<Department>;
  getShiftTypes(): Promise<ShiftType[]>;
  getNurses(): Promise<Nurse[]>;
  getRules(): Promise<Rules>;
  getSchedule(fairness: boolean): Promise<Schedule>;
  getActivity(): Promise<ActivityEvent[]>;
}
