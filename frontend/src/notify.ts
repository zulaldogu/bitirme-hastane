import { notifications } from '@mantine/notifications';

// Ekranların ortak bildirimleri.

export const notifyError = (e: unknown) =>
  notifications.show({
    color: 'red',
    title: 'Bir sorun oluştu',
    message: e instanceof Error ? e.message : String(e),
    radius: 'lg',
  });

export const notifySuccess = (message: string) =>
  notifications.show({ color: 'forest', message, radius: 'lg' });
