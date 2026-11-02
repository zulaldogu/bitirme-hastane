import { Badge, Group, Paper, Progress, Stack, Text } from '@mantine/core';
import { IconMoon } from '@tabler/icons-react';
import type { ScheduleStats } from '../../api/stats';
import { CardHeader } from '../../components/CardHeader';
import { fmt } from '../../format';

const SHOWN = 5;

/** En çok gece alan kişiler; tamamı Adalet sekmesinde. */
export function NightsCard({ stats }: { stats: ScheduleStats }) {
  const sorted = [...stats.nightsPerNurse].sort((a, b) => b.nights - a.nights);
  const max = Math.max(1, sorted[0]?.nights ?? 1);

  return (
    <Paper p={24} h="100%">
      <CardHeader
        icon={<IconMoon size={20} stroke={1.6} />}
        title="Kişi Başı Gece"
        right={
          <Badge size="lg" variant="default" tt="none" fw={500}>
            fark {stats.nightGap}
          </Badge>
        }
      />

      <Text className="num" fz={40} fw={500} lh={1}>
        {fmt(stats.nightAverage, 1)}
      </Text>
      <Text fz="xs" c="dimmed" mb="lg">
        kişi başı ortalama gece vardiyası
      </Text>

      <Stack gap="md">
        {sorted.slice(0, SHOWN).map(({ nurse, nights }, i) => (
          <Stack key={nurse.id} gap={6}>
            <Group justify="space-between">
              <Text fz="sm">{nurse.name}</Text>
              <Text fz="sm" c="dimmed" className="num">
                {nights} gece
              </Text>
            </Group>
            <Progress
              value={(nights / max) * 100}
              size={12}
              radius="xl"
              color={i === 0 ? 'lime.5' : 'gray.4'}
              bg="gray.1"
            />
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
