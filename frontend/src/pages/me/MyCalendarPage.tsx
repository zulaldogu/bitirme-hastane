import { Group, Paper, Select, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { getCurrentSchedule, api, type Nurse, type Schedule, type ShiftType } from '../../api';
import { LeaveMark, ShiftPill } from '../../components/ShiftPill';
import {
  addDays,
  dayOfMonth,
  fmt,
  longDate,
  periodLabel,
  shortWeekdays,
  todayIso,
  weekdayIndex,
} from '../../format';
import { notifyError } from '../../notify';
import { shiftColors } from '../../theme';
import classes from './MyCalendar.module.css';

interface Loaded {
  nurses: Nurse[];
  shiftTypes: ShiftType[];
  schedule: Schedule | null;
  /** Sonraki dönemin çizelgesi: dönem bitmek üzereyken "sıradaki vardiya" oradan gelir. */
  following: Schedule | null;
}

/**
 * K19: personelin kendi görünümü. Giriş ekranı yok (K14); hangi personel olarak
 * bakıldığı sayfadaki seçiciyle değiştirilir.
 */
export function MyCalendarPage({ onNameChange }: { onNameChange: (name: string) => void }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [nurseId, setNurseId] = useState<string | null>(null);
  const today = todayIso();

  useEffect(() => {
    const current = getCurrentSchedule(todayIso());
    Promise.all([
      api.getNurses(),
      api.getShiftTypes(),
      current,
      current.then((s) => (s ? api.getSchedule(addDays(s.startDate, s.days.length)) : null)),
    ])
      .then(([nurses, shiftTypes, schedule, following]) => {
        setData({ nurses, shiftTypes, schedule, following });
        setNurseId(nurses[0]?.id ?? null);
      })
      .catch(notifyError);
  }, []);

  const nurse = data?.nurses.find((n) => n.id === nurseId);
  useEffect(() => {
    if (nurse) onNameChange(nurse.name.split(' ')[0]);
  }, [nurse, onNameChange]);

  if (!data || !nurse) return <Skeleton h={600} radius={28} />;

  const { schedule, shiftTypes } = data;
  const shiftOf = (code: string) => shiftTypes.find((s) => s.code === code)!;
  const mine = schedule?.assignments.filter((a) => a.nurseId === nurse.id) ?? [];
  const upcoming = [...(schedule?.assignments ?? []), ...(data.following?.assignments ?? [])];
  const next = upcoming
    .filter((a) => a.nurseId === nurse.id && a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextSchedule = next && schedule?.days.includes(next.date) ? schedule : data.following;
  const nights = mine.filter((a) => a.shift === 'G').length;
  const allNights = schedule?.assignments.filter((a) => a.shift === 'G').length ?? 0;
  const average = data.nurses.length ? allNights / data.nurses.length : 0;
  const leaveInPeriod = schedule?.days.filter((d) => nurse.leaveDays.includes(d)).length ?? 0;

  const whenLabel = (date: string) =>
    date === today ? 'Bugün' : date === addDays(today, 1) ? 'Yarın' : longDate(date);

  return (
    <Stack gap={20}>
      <Group justify="space-between">
        <Text c="dimmed" fz="sm">
          Prototipte giriş yok: personel görünümünü kimin gözünden göreceğinizi seçin.
        </Text>
        <Select
          w={240}
          radius="xl"
          data={data.nurses.map((n) => ({ value: n.id, label: n.name }))}
          value={nurseId}
          onChange={setNurseId}
          allowDeselect={false}
          aria-label="Personel"
        />
      </Group>

      {!schedule ? (
        <Paper p={32}>
          <Text fz={20} fw={600}>
            Henüz çizelge yok
          </Text>
          <Text c="dimmed">Yöneticin çizelgeyi oluşturunca vardiyaların burada görünecek.</Text>
        </Paper>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing={20}>
            <Paper p={28}>
              <Text c="dimmed">Sıradaki vardiyan</Text>
              {next ? (
                <Group mt="md" wrap="nowrap">
                  <span
                    className={classes.bigPill}
                    style={{ background: shiftColors[next.shift] }}
                  >
                    {next.shift}
                  </span>
                  <Stack gap={2}>
                    <Text fz={28} fw={600} lh={1.1}>
                      {whenLabel(next.date)} · {shiftOf(next.shift).name}
                    </Text>
                    <Text c="dimmed" fz="sm">
                      {longDate(next.date)} · {shiftOf(next.shift).start}–{shiftOf(next.shift).end}
                      {' · '}
                      {coworkers(nextSchedule!, nurse.id, next.date, next.shift, data.nurses)}
                    </Text>
                  </Stack>
                </Group>
              ) : (
                <Text fz={22} fw={600} mt="md">
                  Planlanmış başka vardiyan yok
                </Text>
              )}
            </Paper>
            <Paper p={28} bg="lime.4">
              <Text c="forest.8">Bu dönem gece vardiyan</Text>
              <Text fz={56} fw={600} lh={1.1} className="num">
                {nights}
              </Text>
              <Text c="forest.8">
                servis ortalaması {fmt(average, 1)} · en çok ile en az arasındaki fark{' '}
                {schedule.nightGap ?? '—'}
              </Text>
            </Paper>
            <Paper p={28}>
              <Text c="dimmed">Bu dönem toplam</Text>
              <Text fz={56} fw={600} lh={1.1} className="num">
                {mine.length}
              </Text>
              <Text c="dimmed">
                vardiya · {leaveInPeriod} izin günü · {schedule.days.length - mine.length - leaveInPeriod}{' '}
                boş gün
              </Text>
            </Paper>
          </SimpleGrid>

          <Paper p={28}>
            <Text fz={20} fw={600}>
              14 günlük takvimim · {periodLabel(schedule.days)}
            </Text>
            <Text c="dimmed" fz="sm" mb="lg">
              Çizelge yöneticin tarafından oluşturuldu. Değişiklik için yöneticine başvur.
            </Text>
            <div className={classes.strip}>
              {schedule.days.map((d) => {
                const a = mine.find((x) => x.date === d);
                const leave = nurse.leaveDays.includes(d);
                return (
                  <Stack
                    key={d}
                    gap={4}
                    align="center"
                    className={classes.day}
                    data-today={d === today || undefined}
                    style={
                      a
                        ? { background: `color-mix(in srgb, ${shiftColors[a.shift]} 16%, white)` }
                        : undefined
                    }
                  >
                    <Text fz="sm" c="dimmed">
                      {shortWeekdays[weekdayIndex(d)]}
                    </Text>
                    <Text fz={22} fw={600}>
                      {dayOfMonth(d)}
                    </Text>
                    {a ? (
                      <ShiftPill code={a.shift} />
                    ) : leave ? (
                      <LeaveMark />
                    ) : (
                      <Text fz="xs" c="dimmed" h={24}>
                        boş
                      </Text>
                    )}
                  </Stack>
                );
              })}
            </div>
          </Paper>
        </>
      )}
    </Stack>
  );
}

function coworkers(schedule: Schedule, me: string, date: string, shift: string, nurses: Nurse[]) {
  const others = schedule.assignments
    .filter((a) => a.date === date && a.shift === shift && a.nurseId !== me)
    .map((a) => nurses.find((n) => n.id === a.nurseId)?.name.split(' ')[0])
    .filter(Boolean);
  return others.length ? `birlikte: ${others.join(', ')}` : 'tek başına';
}
