import { Group, Text, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';

/** Kartların üst satırı: yuvarlak çerçeveli ikon, başlık, sağda isteğe bağlı öğe. */
export function CardHeader({
  icon,
  title,
  right,
}: {
  icon: ReactNode;
  title: string;
  right?: ReactNode;
}) {
  return (
    <Group justify="space-between" wrap="nowrap" mb="lg">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={40} radius={999} variant="default" c="dark">
          {icon}
        </ThemeIcon>
        <Text fz={18} fw={500}>
          {title}
        </Text>
      </Group>
      {right}
    </Group>
  );
}
