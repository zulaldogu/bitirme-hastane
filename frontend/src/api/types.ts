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
  /** Her gün, her vardiyada bulunması gereken kişi (çözücü tam bu kadar atar, K29). */
  minStaff: Record<ShiftCode, number>;
  /** Takvim haftası (Pzt–Paz) başına en fazla vardiya. */
  maxShiftsPerWeek: number;
  /** Her vardiyada en az bu kadar kıdemli (salt okunur). */
  minSeniorPerShift: number;
  /** Dinlenme kuralı: `from` gününden sonraki gün `to` olmaz (salt okunur). */
  forbiddenSuccessions: { from: ShiftCode; to: ShiftCode }[];
  nightShift: ShiftCode;
}

/** Arayüzden değiştirilebilen kurallar (Kurallar ekranı). */
export type RulesUpdate = Pick<Rules, 'minStaff' | 'maxShiftsPerWeek'>;

/** Personel ekleme/düzenleme formu. Unvan kıdeme göre sunucuda belirlenir. */
export interface NurseInput {
  name: string;
  senior: boolean;
  leaveDays: string[];
}

export interface Assignment {
  nurseId: string;
  date: string;
  shift: ShiftCode;
}

/**
 * optimal: kanıtlanmış en adil çözüm. feasible: kurallar sağlandı ama süre (10 sn) doldu.
 * infeasible: kurallar bu kadroyla karşılanamaz. unknown: süre içinde çözüm bulunamadı.
 */
export type SolveStatus = 'optimal' | 'feasible' | 'infeasible' | 'unknown';

export interface Violation {
  rule: string;
  message: string;
}

export interface Schedule {
  status: SolveStatus;
  /** Dönemin ilk günü (Pazartesi, K25). */
  startDate: string;
  /** Dönemin günleri, sırayla. */
  days: string[];
  assignments: Assignment[];
  solveSeconds: number;
  /** En çok ve en az gece alan arasındaki fark. Çözüm yoksa null. */
  nightGap: number | null;
  /** En çok ve en az toplam vardiya alan arasındaki fark. */
  totalGap: number | null;
  /** Çözümün oluşturulduğu an (ISO). Çözüm yoksa null. */
  createdAt: string | null;
  /** Kayıtlı çizelgenin güncel personel/kurallarla çelişkileri (veri sonradan değiştiyse). */
  violations: Violation[];
}

export type ActivityKind = 'leave-request' | 'success' | 'warning' | 'info' | 'leave';

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
  createNurse(input: NurseInput): Promise<Nurse>;
  updateNurse(id: string, input: NurseInput): Promise<Nurse>;
  deleteNurse(id: string): Promise<void>;
  getRules(): Promise<Rules>;
  updateRules(update: RulesUpdate): Promise<Rules>;
  /** Dönemin son çizelgesi; `start` verilmezse en son oluşturulan. Yoksa null. */
  getSchedule(start?: string): Promise<Schedule | null>;
  /** Çözücüyü çalıştırır. Her zaman adil gece dağılımı amacıyla üretilir (K20). */
  generateSchedule(start: string): Promise<Schedule>;
  /** Dönemin olayları; `start` verilmezse en son oluşturulan çizelgeninkiler. */
  getActivity(start?: string): Promise<ActivityEvent[]>;
}
