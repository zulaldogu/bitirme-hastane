import { Avatar, Badge, Group, SegmentedControl, Stack, Text, UnstyledButton } from '@mantine/core';
import classes from './AppHeader.module.css';

export interface NavTab {
  id: string;
  label: string;
  ready: boolean;
}

export type Role = 'manager' | 'staff';

interface Props {
  tabs: NavTab[];
  active: string;
  onTabChange: (id: string) => void;
  role: Role;
  onRoleChange: (role: Role) => void;
  greetingName: string;
  subtitle: string;
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toLocaleUpperCase('tr');

export function AppHeader(props: Props) {
  return (
    <Group justify="space-between" wrap="wrap" gap="md" className={classes.header}>
      <Group gap="sm" wrap="nowrap">
        <Avatar size={44} radius="xl" color="forest" variant="filled">
          {initials(props.greetingName)}
        </Avatar>
        <Stack gap={0}>
          <Text fz={22} fw={500} lh={1.2}>
            Merhaba, {props.greetingName}
          </Text>
          <Text fz="sm" c="dimmed">
            {props.subtitle}
          </Text>
        </Stack>
      </Group>

      {props.role === 'manager' && (
        <Group gap={4} className={classes.tabs} wrap="nowrap">
          {props.tabs.map((tab) => (
            <UnstyledButton
              key={tab.id}
              className={classes.tab}
              data-active={tab.id === props.active || undefined}
              onClick={() => props.onTabChange(tab.id)}
            >
              {tab.label}
              {!tab.ready && (
                <Badge size="xs" variant="light" color="gray" ml={6} className={classes.soon}>
                  yakında
                </Badge>
              )}
            </UnstyledButton>
          ))}
        </Group>
      )}

      <SegmentedControl
        radius="xl"
        size="sm"
        value={props.role}
        onChange={(v) => props.onRoleChange(v as Role)}
        data={[
          { value: 'manager', label: 'Yönetici' },
          { value: 'staff', label: 'Personel' },
        ]}
        classNames={{ root: classes.role, indicator: classes.roleIndicator }}
      />
    </Group>
  );
}
