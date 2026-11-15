import type { SolveStatus } from '../../api';

/** Çözüm bulunamadığında gösterilen açıklama (K19: genel olası nedenler). */
export function unsolvedMessage(status: SolveStatus): string {
  return status === 'infeasible'
    ? 'Kurallar bu kadroyla karşılanamıyor. Olası nedenler: vardiya başına istenen kişi sayısı fazla, kıdemli hemşire az, aynı günlerde çok kişi izinli veya haftalık sınır düşük.'
    : '10 saniye içinde bir çözüm bulunamadı. Kuralları biraz gevşetip yeniden deneyin.';
}
