import { ActionIcon, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconCalendarOff,
  IconCheck,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconListDetails,
  IconUserQuestion,
  IconX,
} from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import type { ActivityEvent, ActivityKind } from '../../api';
import { CardHeader } from '../../components/CardHeader';
import classes from './Overview.module.css';

const icons: Record<ActivityKind, ReactNode> = {
  'leave-request': <IconUserQuestion size={18} />,
  success: <IconCircleCheck size={18} />,
  warning: <IconAlertTriangle size={18} />,
  info: <IconInfoCircle size={18} />,
  leave: <IconCalendarOff size={18} />,
};

/** Son olaylar. İzin talebi satırı prototipte yalnızca görseldir. */
export function ActivityCard({ events }: { events: ActivityEvent[] }) {
  const [decided, setDecided] = useState<Record<string, 'ok' | 'no'>>({});

  return (
    <Paper p={24} h="100%">
      <CardHeader icon={<IconListDetails size={20} stroke={1.6} />} title="Son Olaylar" />

      <Stack gap={0}>
        {events.map((e) => {
          const pending = e.kind === 'leave-request' && !decided[e.id];
          const subtitle =
            decided[e.id] === 'ok' ? 'Onaylandı' : decided[e.id] === 'no' ? 'Reddedildi' : e.subtitle;
          return (
            <Group
              key={e.id}
              wrap="nowrap"
              gap="sm"
              className={pending ? classes.pendingRow : classes.eventRow}
            >
              <ThemeIcon
                size={38}
                radius={999}
                variant="default"
                c={e.kind === 'success' ? 'forest.6' : e.kind === 'warning' ? 'red.7' : 'dark'}
              >
                {icons[e.kind]}
              </ThemeIcon>
              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text fz="sm" fw={500} truncate>
                  {e.title}
                </Text>
                <Text fz="xs" c={pending ? 'orange.7' : 'dimmed'}>
                  {subtitle}
                </Text>
              </Stack>
              {pending && (
                <Group gap={6} wrap="nowrap">
                  <ActionIcon
                    radius={999}
                    size={32}
                    color="lime.5"
                    c="forest.9"
                    aria-label="Onayla"
                    onClick={() => setDecided((d) => ({ ...d, [e.id]: 'ok' }))}
                  >
                    <IconCheck size={16} />
                  </ActionIcon>
                  <ActionIcon
                    radius={999}
                    size={32}
                    variant="default"
                    aria-label="Reddet"
                    onClick={() => setDecided((d) => ({ ...d, [e.id]: 'no' }))}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              )}
            </Group>
          );
        })}
      </Stack>
    </Paper>
  );
}
