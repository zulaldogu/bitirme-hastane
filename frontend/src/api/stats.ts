import type { Nurse, Rules, Schedule, ShiftCode } from './types';

// Bir çizelgeden ekranların gösterdiği özet sayıları türetir.

export interface ScheduleStats {
  required: number;
  covered: number;
  byShift: Record<ShiftCode, number>;
  nightsPerNurse: { nurse: Nurse; nights: number; total: number }[];
  nightGap: number;
  nightAverage: number;
  nightStdDev: number;
  seniorCoverage: number; // 0–1
}

export function computeStats(schedule: Schedule, nurses: Nurse[], rules: Rules): ScheduleStats {
  const codes: ShiftCode[] = ['S', 'A', 'G'];
  const byShift: Record<ShiftCode, number> = { S: 0, A: 0, G: 0 };
  for (const a of schedule.assignments) byShift[a.shift]++;

  let required = 0;
  let covered = 0;
  let seniorSlots = 0;
  const seniorIds = new Set(nurses.filter((n) => n.senior).map((n) => n.id));
  for (const day of schedule.days) {
    for (const code of codes) {
      const here = schedule.assignments.filter((a) => a.date === day && a.shift === code);
      required += rules.minStaff[code];
      covered += Math.min(here.length, rules.minStaff[code]);
      if (here.some((a) => seniorIds.has(a.nurseId))) seniorSlots++;
    }
  }

  const nightsPerNurse = nurses.map((nurse) => {
    const mine = schedule.assignments.filter((a) => a.nurseId === nurse.id);
    return { nurse, nights: mine.filter((a) => a.shift === 'G').length, total: mine.length };
  });
  const counts = nightsPerNurse.map((x) => x.nights);
  const nightAverage = counts.reduce((s, x) => s + x, 0) / counts.length;
  const nightStdDev = Math.sqrt(
    counts.reduce((s, x) => s + (x - nightAverage) ** 2, 0) / counts.length,
  );

  return {
    required,
    covered,
    byShift,
    nightsPerNurse,
    nightGap: Math.max(...counts) - Math.min(...counts),
    nightAverage,
    nightStdDev,
    seniorCoverage: seniorSlots / (schedule.days.length * codes.length),
  };
}
