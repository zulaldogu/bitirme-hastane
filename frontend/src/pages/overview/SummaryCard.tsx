import { ActionIcon, Badge, Button, Group, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { IconArrowUpRight, IconCircleCheck, IconSparkles, IconUserPlus } from '@tabler/icons-react';
import type { Schedule } from '../../api';
import type { ScheduleStats } from '../../api/stats';
import { fmt, periodLabel } from '../../format';
import classes from './Overview.module.css';

interface Props {
  schedule: Schedule;
  stats: ScheduleStats;
  fairness: boolean;
  onFairnessChange: (on: boolean) => void;
  solving: boolean;
  onSolve: () => void;
  onNavigate: (tab: string) => void;
}

/** Aktif çizelgenin özeti: kaç vardiya karşılandı, hangi dönem. */
export function SummaryCard(props: Props) {
  const { stats } = props;
  const complete = stats.covered === stats.required;

  return (
    <Paper p={{ base: 20, md: 28 }} h="100%">
      <Stack justify="space-between" h="100%" gap="xl">
        <Group justify="space-between" align="flex-start">
          <SegmentedControl
            radius="xl"
            value={props.fairness ? 'on' : 'off'}
            onChange={(v) => props.onFairnessChange(v === 'on')}
            data={[
              { value: 'on', label: 'Adalet açık' },
              { value: 'off', label: 'Adalet kapalı' },
            ]}
            classNames={{ root: classes.pillSwitch }}
          />
          <Stack gap={2} align="flex-end">
            <Text fz="sm" c="dimmed">
              Dönem
            </Text>
            <Text fz={20} fw={500}>
              {periodLabel(props.schedule.days)}
            </Text>
          </Stack>
        </Group>

        <Stack gap={6}>
          <Text fz="sm" c="dimmed">
            Karşılanan vardiya ihtiyacı
          </Text>
          <Group gap="md" align="center">
            <Text className="num" fz={{ base: 48, md: 64 }} fw={500} lh={1}>
              {fmt(stats.covered)}
              <Text span inherit c="gray.4">
                {' '}
                / {fmt(stats.required)}
              </Text>
            </Text>
            {complete && (
              <Badge
                size="lg"
                color="lime.2"
                c="forest.9"
                leftSection={<IconCircleCheck size={16} />}
                tt="none"
                fw={500}
              >
                Tüm ihtiyaç karşılandı
              </Badge>
            )}
          </Group>
          <Text fz="sm" c="dimmed">
            {props.schedule.assignments.length} atama · çözüm{' '}
            {fmt(props.schedule.solveSeconds, 2)} sn
          </Text>
        </Stack>

        <Group justify="space-between" align="flex-end">
          <Group gap="sm">
            <Button
              size="md"
              color="forest.8"
              c="lime.3"
              leftSection={<IconSparkles size={18} />}
              loading={props.solving}
              onClick={props.onSolve}
            >
              Çizelge Oluştur
            </Button>
            <Button
              size="md"
              variant="outline"
              color="forest.8"
              leftSection={<IconUserPlus size={18} />}
              onClick={() => props.onNavigate('staff')}
            >
              Personel Ekle
            </Button>
          </Group>
          <ActionIcon
            size={72}
            radius={999}
            color="lime.4"
            c="forest.9"
            aria-label="Çizelgeye git"
            onClick={() => props.onNavigate('schedule')}
          >
            <IconArrowUpRight size={32} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Stack>
    </Paper>
  );
}
