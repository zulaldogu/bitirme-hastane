import {
  Alert,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconInfoCircle,
  IconSparkles,
  IconStarFilled,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import {
  api,
  getCurrentSchedule,
  periodDays,
  type Nurse,
  type Rules,
  type Schedule,
  type ShiftCode,
  type ShiftType,
} from '../../api';
import { LeaveMark, ShiftPill } from '../../components/ShiftPill';
import {
  addDays,
  dayOfMonth,
  fmt,
  mondayOf,
  periodLabel,
  shortWeekdays,
  todayIso,
  weekdayIndex,
} from '../../format';
import { notifyError, notifySuccess } from '../../notify';
import classes from './Schedule.module.css';
import { unsolvedMessage } from './unsolved';

const PERIOD = 14; // K25

interface Base {
  nurses: Nurse[];
  rules: Rules;
  shiftTypes: ShiftType[];
}

/** K19: personel × gün tablosu, salt okunur. Dönem 14 gün, Pazartesi başlar. */
export function SchedulePage() {
  const [base, setBase] = useState<Base | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // İlk açılış: son oluşturulan çizelgenin dönemi, yoksa bu haftanın dönemi.
  useEffect(() => {
    Promise.all([api.getNurses(), api.getRules(), api.getShiftTypes(), getCurrentSchedule(todayIso())])
      .then(([nurses, rules, shiftTypes, latest]) => {
        setBase({ nurses, rules, shiftTypes });
        setSchedule(latest);
        setStart(latest?.startDate ?? mondayOf(todayIso()));
        setLoading(false);
      })
      .catch(notifyError);
  }, []);

  const goTo = async (next: string) => {
    setStart(next);
    setFailure(null);
    setLoading(true);
    try {
      setSchedule(await api.getSchedule(next));
    } catch (e) {
      notifyError(e);
    } finally {
      setLoading(false);
    }
  };

  const solve = async () => {
    if (!start) return;
    setSolving(true);
    setFailure(null);
    try {
      const result = await api.generateSchedule(start);
      if (result.assignments.length === 0) {
        setFailure(unsolvedMessage(result.status));
      } else {
        setSchedule(result);
        notifySuccess(`Çizelge oluşturuldu (${fmt(result.solveSeconds, 1)} sn).`);
      }
    } catch (e) {
      notifyError(e);
    } finally {
      setSolving(false);
    }
  };

  if (!base || !start) return <Skeleton h={820} radius={28} />;

  const days = periodDays(start, PERIOD);

  return (
    <Paper p={{ base: 20, md: 24 }}>
      <Group justify="space-between" align="flex-start" mb="md" gap="md">
        <Stack gap={2}>
          <Text fz={22} fw={600}>
            Çizelge · {periodLabel(days)}
          </Text>
          <Summary schedule={schedule} rules={base.rules} />
        </Stack>
        <Group gap="xs">
          <Button
            variant="default"
            leftSection={<IconChevronLeft size={16} />}
            onClick={() => goTo(addDays(start, -PERIOD))}
            disabled={solving}
          >
            Önceki dönem
          </Button>
          <DatePickerInput
            value={start}
            onChange={(v) => v && goTo(mondayOf(v))}
            excludeDate={(d) => weekdayIndex(String(d).slice(0, 10)) !== 0}
            valueFormatter={() => periodLabel(days)}
            leftSection={<IconCalendarEvent size={16} />}
            radius="xl"
            w={210}
            disabled={solving}
            aria-label="Dönem başlangıcı (Pazartesi)"
          />
          <Button
            variant="default"
            rightSection={<IconChevronRight size={16} />}
            onClick={() => goTo(addDays(start, PERIOD))}
            disabled={solving}
          >
            Sonraki dönem
          </Button>
          <Button
            color="forest.8"
            c="lime.3"
            leftSection={<IconSparkles size={18} />}
            loading={solving}
            onClick={solve}
          >
            {schedule ? 'Yeniden Oluştur' : 'Çizelge Oluştur'}
          </Button>
        </Group>
      </Group>

      {failure && (
        <Alert color="red" radius="lg" mb="md" icon={<IconAlertTriangle />} title="Çözüm bulunamadı">
          {failure}
        </Alert>
      )}
      {schedule && schedule.violations.length > 0 && !solving && (
        <Alert
          color="orange"
          radius="lg"
          mb="md"
          icon={<IconAlertTriangle />}
          title="Personel veya kurallar bu çizelgeden sonra değişti"
        >
          {schedule.violations.length} kural ihlali var, örneğin: {schedule.violations[0].message}{' '}
          Güncel veriyle yeniden oluşturun.
        </Alert>
      )}
      {schedule?.status === 'feasible' && (
        <Alert color="gray" radius="lg" mb="md" icon={<IconInfoCircle />}>
          Tüm kurallar sağlandı, ancak süre (10 sn) dolduğu için bunun en adil çözüm olduğu
          kanıtlanamadı.
        </Alert>
      )}

      <Legend shiftTypes={base.shiftTypes} />

      {loading || solving ? (
        <Stack gap={8}>
          {base.nurses.map((n) => (
            <Skeleton key={n.id} h={28} radius="md" />
          ))}
        </Stack>
      ) : schedule ? (
        <ScheduleTable schedule={schedule} {...base} />
      ) : (
        <Stack align="center" py={80} gap="sm">
          <ThemeIcon size={72} radius={999} color="lime.4" c="forest.9">
            <IconCalendarEvent size={34} />
          </ThemeIcon>
          <Text fz={20} fw={600}>
            Bu dönem için çizelge yok
          </Text>
          <Text c="dimmed">"Çizelge Oluştur"a basın; çözücü en adil çizelgeyi birkaç saniyede bulur.</Text>
        </Stack>
      )}
    </Paper>
  );
}

function Summary({ schedule, rules }: { schedule: Schedule | null; rules: Rules }) {
  if (!schedule) return <Text c="dimmed" fz="sm">14 gün · Pazartesi başlangıç</Text>;
  const required = schedule.days.length * Object.values(rules.minStaff).reduce((s, x) => s + x, 0);
  const created = schedule.createdAt
    ? new Date(schedule.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : '';
  return (
    <Text c="dimmed" fz="sm">
      {fmt(schedule.assignments.length)}/{fmt(required)} vardiya · gece farkı {schedule.nightGap} · toplam
      farkı {schedule.totalGap} · {fmt(schedule.solveSeconds, 1)} sn · {created}
    </Text>
  );
}

function Legend({ shiftTypes }: { shiftTypes: ShiftType[] }) {
  return (
    <Group gap="lg" mb="sm" fz="sm">
      {shiftTypes.map((s) => (
        <Group key={s.code} gap={6}>
          <ShiftPill code={s.code} />
          <Text fz="sm">
            {s.name} {s.start.slice(0, 2)}–{s.end.slice(0, 2)}
          </Text>
        </Group>
      ))}
      <Group gap={6}>
        <LeaveMark />
        <Text fz="sm">İzinli</Text>
      </Group>
      <Group gap={6}>
        <IconStarFilled size={12} color="#c99a1e" />
        <Text fz="sm">Kıdemli</Text>
      </Group>
    </Group>
  );
}

function ScheduleTable({ schedule, nurses, rules, shiftTypes }: Base & { schedule: Schedule }) {
  const cell = new Map(schedule.assignments.map((a) => [`${a.nurseId}|${a.date}`, a.shift]));
  const today = todayIso();
  const weekend = (d: string) => weekdayIndex(d) >= 5;
  const count = (date: string, code: ShiftCode) =>
    schedule.assignments.filter((a) => a.date === date && a.shift === code).length;

  return (
    <div className={classes.scroll}>
      <table className={classes.table}>
        <thead>
          <tr>
            <th className={classes.name}>Personel</th>
            {schedule.days.map((d) => (
              <th key={d} data-weekend={weekend(d) || undefined} data-today={d === today || undefined}>
                <span className={classes.weekday}>{shortWeekdays[weekdayIndex(d)]}</span>
                <span className={classes.dayNum}>{dayOfMonth(d)}</span>
              </th>
            ))}
            <th>Top.</th>
            <th>Gece</th>
          </tr>
        </thead>
        <tbody>
          {nurses.map((n) => {
            const mine = schedule.assignments.filter((a) => a.nurseId === n.id);
            return (
              <tr key={n.id}>
                <td className={classes.name}>
                  {n.senior && <IconStarFilled size={11} color="#c99a1e" style={{ marginRight: 6 }} />}
                  {n.name}
                </td>
                {schedule.days.map((d) => {
                  const code = cell.get(`${n.id}|${d}`);
                  return (
                    <td key={d} data-weekend={weekend(d) || undefined}>
                      {code ? <ShiftPill code={code} /> : n.leaveDays.includes(d) ? <LeaveMark /> : null}
                    </td>
                  );
                })}
                <td className={classes.total}>{mine.length}</td>
                <td className={classes.total}>{mine.filter((a) => a.shift === rules.nightShift).length}</td>
              </tr>
            );
          })}
          <tr className={classes.divider}>
            <td colSpan={schedule.days.length + 3} />
          </tr>
          {shiftTypes.map((s) => (
            <tr key={s.code}>
              <td className={`${classes.name} ${classes.coverLabel}`}>{s.name} atanan/gereken</td>
              {schedule.days.map((d) => {
                const have = count(d, s.code);
                const need = rules.minStaff[s.code];
                return (
                  <td key={d} data-weekend={weekend(d) || undefined}>
                    <Tooltip label={`${s.name}: ${have} kişi, en az ${need}`} withArrow>
                      <span className={have >= need ? classes.ok : classes.bad}>
                        {have}/{need}
                      </span>
                    </Tooltip>
                  </td>
                );
              })}
              <td />
              <td />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
