import { DonutChart } from '@mantine/charts';
import { Badge, Box, Center, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconChartDonut, IconMoon } from '@tabler/icons-react';
import type { ShiftCode } from '../../api';
import type { ScheduleStats } from '../../api/stats';
import { CardHeader } from '../../components/CardHeader';
import { fmt } from '../../format';
import { shiftColors, shiftNames } from '../../theme';

const codes: ShiftCode[] = ['S', 'A', 'G'];

/** Atamaların Sabah / Akşam / Gece dağılımı. */
export function ShiftMixCard({ stats, days }: { stats: ScheduleStats; days: string[] }) {
  const total = codes.reduce((s, c) => s + stats.byShift[c], 0);
  const nightShare = total ? (stats.byShift.G / total) * 100 : 0;

  return (
    <Paper p={24} h="100%">
      <CardHeader
        icon={<IconChartDonut size={20} stroke={1.6} />}
        title="Vardiya Dağılımı"
        right={
          <Badge size="lg" variant="default" tt="none" fw={500}>
            {days.length} gün
          </Badge>
        }
      />

      <Center pos="relative">
        <DonutChart
          size={190}
          thickness={18}
          paddingAngle={4}
          withTooltip={false}
          data={codes.map((c) => ({ name: shiftNames[c], value: stats.byShift[c], color: shiftColors[c] }))}
        />
        <Stack gap={0} align="center" pos="absolute">
          <Text className="num" fz={28} fw={500}>
            {fmt(total)}
          </Text>
          <Text fz="xs" c="dimmed">
            atama
          </Text>
        </Stack>
      </Center>

      <Center my="md">
        <Badge
          size="lg"
          variant="default"
          tt="none"
          fw={500}
          leftSection={<IconMoon size={14} />}
        >
          Gece vardiyaları %{fmt(nightShare)}
        </Badge>
      </Center>

      <SimpleGrid cols={3} spacing="xs">
        {codes.map((c) => (
          <Group key={c} gap={6} wrap="nowrap">
            <Box w={10} h={10} bg={shiftColors[c]} style={{ borderRadius: 99 }} />
            <Text fz="sm">
              {shiftNames[c]}{' '}
              <Text span c="dimmed" inherit>
                {stats.byShift[c]}
              </Text>
            </Text>
          </Group>
        ))}
      </SimpleGrid>
    </Paper>
  );
}
