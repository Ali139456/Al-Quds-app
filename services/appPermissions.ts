import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import {
  getPermissionStatus,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from '@/services/notifications';

const PERMISSIONS_PROMPT_KEY = '@alquds_permissions_prompted_v1';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export async function wasPermissionsPromptShown(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PERMISSIONS_PROMPT_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markPermissionsPromptShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(PERMISSIONS_PROMPT_KEY, '1');
  } catch {
    /* ignore */
  }
}

export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

/** Shows the Android/iOS system location permission dialog. */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestAllAppPermissions(): Promise<{
  notifications: NotificationPermissionStatus;
  location: LocationPermissionStatus;
}> {
  const notifications = await requestNotificationPermission();
  const location = await requestLocationPermission();
  return { notifications, location };
}

export { getPermissionStatus, requestNotificationPermission };
