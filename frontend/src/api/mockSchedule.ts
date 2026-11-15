import type { Assignment, Nurse, Rules, ShiftCode } from './types';

// Sahte çizelge üreticisi. Gerçek çözücü (CP-SAT) hazır olana kadar ekranları
// besler. Açgözlü (greedy) çalışır: K8'deki sert kısıtları sağlar ama en iyi
// çözümü aramaz. Adil gece dağılımı için geceleri her zaman o ana kadar en az
// gece alana verir (K20).

// Açgözlü seçim ileriyi görmediği için bazen çıkmaza girer (ör. Cumartesi
// Akşam/Gece çalışan kıdemliler Pazar Sabah'a atanamaz). Bu durumda eşitlikler
// farklı bozularak yeniden denenir. Tohum sabit: her açılışta aynı çizelge.
const ORDER: ShiftCode[] = ['G', 'A', 'S'];

export function generateMockSchedule(
  nurses: Nurse[],
  days: string[],
  rules: Rules,
): Assignment[] {
  for (let seed = 1; seed <= 500; seed++) {
    try {
      return attempt(nurses, days, rules, mulberry32(seed));
    } catch {
      // sonraki tohum
    }
  }
  throw new Error('Sahte çizelge üretilemedi');
}

function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function attempt(
  nurses: Nurse[],
  days: string[],
  rules: Rules,
  random: () => number,
): Assignment[] {
  const prev = new Map<string, ShiftCode | null>();
  const nights = new Map<string, number>();
  const total = new Map<string, number>();
  const week = new Map<string, number>();
  for (const n of nurses) {
    prev.set(n.id, null);
    nights.set(n.id, 0);
    total.set(n.id, 0);
  }

  const assignments: Assignment[] = [];

  days.forEach((date, d) => {
    if (d % 7 === 0) for (const n of nurses) week.set(n.id, 0);
    const today = new Map<string, ShiftCode>();
    const tie = new Map(nurses.map((n) => [n.id, random()]));

    for (const shift of ORDER) {
      const eligible = nurses.filter((n) => {
        if (n.leaveDays.includes(date) || today.has(n.id)) return false;
        if (week.get(n.id)! >= rules.maxShiftsPerWeek) return false;
        const p = prev.get(n.id);
        // Dinlenme: Geceden sonra yalnız Gece, Akşamdan sonra Sabah yok.
        if (p === 'G' && shift !== 'G') return false;
        if (p === 'A' && shift === 'S') return false;
        return true;
      });

      const key = (n: Nurse): number[] => {
        const t = tie.get(n.id)!;
        if (shift === 'G') return [nights.get(n.id)!, total.get(n.id)!, t];
        return [week.get(n.id)!, total.get(n.id)!, t];
      };
      const byKey = (a: Nurse, b: Nurse) => {
        const ka = key(a);
        const kb = key(b);
        for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
        return 0;
      };

      const picked: Nurse[] = [];
      const senior = eligible.filter((n) => n.senior).sort(byKey)[0];
      if (!senior) throw new Error(`${date} ${shift}: kıdemli bulunamadı`);
      picked.push(senior);
      // Kıdemlileri sonraki vardiyalara saklamak için önce kıdemsizler.
      const rest = eligible
        .filter((n) => n !== senior)
        .sort((a, b) => Number(a.senior) - Number(b.senior) || byKey(a, b));
      picked.push(...rest.slice(0, rules.minStaff[shift] - 1));
      if (picked.length < rules.minStaff[shift]) {
        throw new Error(`${date} ${shift}: yeterli personel yok`);
      }

      for (const n of picked) {
        today.set(n.id, shift);
        week.set(n.id, week.get(n.id)! + 1);
        total.set(n.id, total.get(n.id)! + 1);
        if (shift === 'G') nights.set(n.id, nights.get(n.id)! + 1);
        assignments.push({ nurseId: n.id, date, shift });
      }
    }

    for (const n of nurses) prev.set(n.id, today.get(n.id) ?? null);
  });

  return assignments;
}
