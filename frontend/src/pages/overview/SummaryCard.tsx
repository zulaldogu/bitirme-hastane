import { Avatar, Button, Group, Paper, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core';
import { IconSparkles, IconStarFilled, IconUserPlus } from '@tabler/icons-react';
import type { Nurse, Rules, Schedule, ShiftType } from '../../api';
import type { ScheduleStats } from '../../api/stats';
import { fmt, periodLabel } from '../../format';
import { shiftColors } from '../../theme';
import classes from './Overview.module.css';

interface Props {
  schedule: Schedule;
  stats: ScheduleStats;
  nurses: Nurse[];
  rules: Rules;
  shiftTypes: ShiftType[];
  solving: boolean;
  onSolve: () => void;
  onNavigate: (tab: string) => void;
}

const longDate = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
  timeZone: 'UTC',
});

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toLocaleUpperCase('tr');

/** Bugün hangi vardiyada kim var; altında dönemin özeti. */
export function SummaryCard(props: Props) {
  const { schedule, stats } = props;
  // Bugün dönemin içindeyse o gün, değilse dönemin ilk günü gösterilir.
  const now = new Date().toISOString().slice(0, 10);
  const today = schedule.days.includes(now) ? now : schedule.days[0];

  return (
    <Paper p={{ base: 20, md: 28 }} h="100%">
      <Stack justify="space-between" h="100%" gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text fz="sm" c="dimmed">
              Bugün
            </Text>
            <Text fz={26} fw={500}>
              {longDate.format(new Date(today))}
            </Text>
          </Stack>
          <Stack gap={2} align="flex-end">
            <Text fz="sm" c="dimmed">
              Dönem
            </Text>
            <Text fz={18} fw={500}>
              {periodLabel(schedule.days)}
            </Text>
          </Stack>
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm">
          {props.shiftTypes.map((s) => {
            const people = schedule.assignments
              .filter((a) => a.date === today && a.shift === s.code)
              .map((a) => props.nurses.find((n) => n.id === a.nurseId)!);
            return (
              <Stack
                key={s.code}
                gap={10}
                p={16}
                className={classes.shiftBox}
                style={{ background: `color-mix(in srgb, ${shiftColors[s.code]} 14%, white)` }}
              >
                <Group justify="space-between">
                  <Text fw={600}>{s.name}</Text>
                  <Text fz="xs" c="dimmed">
                    {s.start.slice(0, 2)}–{s.end.slice(0, 2)}
                  </Text>
                </Group>
                <Avatar.Group spacing={8}>
                  {people.map((n) => (
                    <Tooltip key={n.id} label={n.name} withArrow>
                      <Avatar radius="xl" size={36} variant="filled" color={shiftColors[s.code]}>
                        {initials(n.name)}
                      </Avatar>
                    </Tooltip>
                  ))}
                </Avatar.Group>
                <Group gap={6}>
                  <Text fz="sm" className="num">
                    {people.length}/{props.rules.minStaff[s.code]} kişi
                  </Text>
                  {people.some((n) => n.senior) && (
                    <Tooltip label="Kıdemli var" withArrow>
                      <IconStarFilled size={12} color="#c99a1e" />
                    </Tooltip>
                  )}
                </Group>
              </Stack>
            );
          })}
        </SimpleGrid>

        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Button
              color="forest.8"
              c="lime.3"
              leftSection={<IconSparkles size={18} />}
              loading={props.solving}
              onClick={props.onSolve}
            >
              Çizelge Oluştur
            </Button>
            <Button
              variant="outline"
              color="forest.8"
              leftSection={<IconUserPlus size={18} />}
              onClick={() => props.onNavigate('staff')}
            >
              Personel Ekle
            </Button>
          </Group>
          <Text fz="sm" c="dimmed">
            <Text span fw={600} c="dark" className="num">
              {fmt(stats.covered)}/{fmt(stats.required)}
            </Text>{' '}
            vardiya karşılandı
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}
