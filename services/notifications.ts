import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Expo Push Notifications (uses FCM on Android, APNs on iOS).
 * Perfect for MVP; works with EAS Build and development builds.
 */

export type NotificationPermissionStatus = 'undetermined' | 'granted' | 'denied';

// How to show notifications when received (foreground + background)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldAnimate: true,
    }),
  });
}

export async function getPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!Device.isDevice) return 'denied';

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return 'granted';
  if (existingStatus === 'denied') return 'denied';

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

/**
 * Register for push notifications and return Expo push token.
 * Requires a physical device; use EAS projectId for production.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push (remote) notifications were removed from Expo Go in SDK 53; use a development build instead.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e85d04',
    });
  }

  const status = await requestNotificationPermission();
  if (status !== 'granted') {
    console.warn('Push permission not granted:', status);
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      'Expo projectId not set. Run "eas init" or add extra.eas.projectId in app.json for push tokens.'
    );
    return null;
  }

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenResult.data;
  } catch (e) {
    console.warn('Failed to get Expo push token:', e);
    return null;
  }
}
