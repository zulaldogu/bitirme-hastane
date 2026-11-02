import { Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Paper p={48} mih={420}>
      <Stack align="center" justify="center" gap="md" mih={324} ta="center">
        <ThemeIcon size={88} radius={999} color="lime.4" c="forest.9">
          <IconSparkles size={40} stroke={1.5} />
        </ThemeIcon>
        <Text c="dimmed" fz="sm" tt="uppercase" fw={600} lts={1}>
          {title}
        </Text>
        <Title order={2} fz={40} fw={500}>
          Yakında
        </Title>
        <Text c="dimmed" maw={420}>
          {description}
        </Text>
      </Stack>
    </Paper>
  );
}
