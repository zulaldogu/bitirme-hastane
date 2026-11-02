import { Badge, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconMoon, IconScale, IconStar } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import type { ScheduleStats } from '../../api/stats';
import { fmt } from '../../format';
import classes from './Overview.module.css';

interface Props {
  stats: ScheduleStats;
  /** Adalet amacı olmadan bulunan çözümün özeti, kıyas için. */
  baseline: ScheduleStats;
}

/** Adil gece dağılımı (K10): en çok ve en az gece alan arasındaki fark. */
export function FairnessCard({ stats, baseline }: Props) {
  const diff = stats.nightGap - baseline.nightGap;

  return (
    <Paper p={{ base: 20, md: 28 }} h="100%" bg="lime.4" className={classes.fairCard}>
      <svg className={classes.star} viewBox="0 0 100 100" aria-hidden>
        <path d="M50 0 C55 35 65 45 100 50 C65 55 55 65 50 100 C45 65 35 55 0 50 C35 45 45 35 50 0Z" />
      </svg>

      <Stack gap="xl" pos="relative">
        <Group gap={8} className={classes.fairPill} w="fit-content">
          <Text fz="sm" fw={600} c="lime.3" lts={1}>
            ADALET
          </Text>
          <IconScale size={18} color="var(--mantine-color-lime-3)" />
        </Group>

        <Stack gap={4}>
          <Text fz="sm" c="forest.9">
            Gece farkı (en çok − en az)
          </Text>
          <Group gap="sm" align="center">
            <Text className="num" fz={{ base: 48, md: 60 }} fw={500} lh={1} c="forest.9">
              {stats.nightGap} gece
            </Text>
            {diff !== 0 && (
              <Badge size="lg" color="white" c={diff < 0 ? 'forest.8' : 'red.7'} tt="none" fw={500}>
                {diff > 0 ? '+' : '−'}
                {Math.abs(diff)} adaletsiz çözüme göre
              </Badge>
            )}
          </Group>
        </Stack>

        <SimpleGrid cols={2} spacing="sm">
          <StatBox label="Kişi başı ort. gece" icon={<IconMoon size={18} />}>
            {fmt(stats.nightAverage, 1)}
          </StatBox>
          <StatBox label="Kıdemli kapsamı" icon={<IconStar size={18} />}>
            %{fmt(stats.seniorCoverage * 100)}
          </StatBox>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

function StatBox({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className={classes.fairBox}>
      <Text fz="xs" c="forest.9" mb={6}>
        {label}
      </Text>
      <Group gap={6} c="forest.9">
        {icon}
        <Text className="num" fz={22} fw={500}>
          {children}
        </Text>
      </Group>
    </div>
  );
}
