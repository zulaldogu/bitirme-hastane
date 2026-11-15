import type { ShiftCode } from '../api';
import { shiftColors } from '../theme';
import classes from './ShiftPill.module.css';

/** Renkli vardiya hapı (S/A/G). İzinli gün için `leave`. */
export function ShiftPill({ code, size = 'md' }: { code: ShiftCode; size?: 'md' | 'lg' }) {
  return (
    <span className={classes.pill} data-size={size} style={{ background: shiftColors[code] }}>
      {code}
    </span>
  );
}

export function LeaveMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return <span className={classes.leave} data-size={size} aria-label="İzinli" />;
}
