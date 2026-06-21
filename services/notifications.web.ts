export type NotificationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export async function getPermissionStatus(): Promise<NotificationPermissionStatus> {
  return 'denied';
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  return 'denied';
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  return null;
}
