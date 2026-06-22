import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Production backend — used when env is missing in standalone APK builds. */
const PRODUCTION_API_URL = 'https://al-quds-app-production.up.railway.app';

/**
 * Backend API base URL. When set, orders, users, and menu sync to the backend.
 * - Web / same machine: http://localhost:4000
 * - App on phone: use your computer's LAN IP, e.g. http://192.168.1.5:4000
 *   (Find IP: Windows = ipconfig, Mac = System Settings > Network.)
 * Set EXPO_PUBLIC_API_URL in .env for phone testing, then restart Expo.
 */
function getDevMachineHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0] ?? null;
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) return debuggerHost.split(':')[0] ?? null;
  return null;
}

function resolveApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    return 'http://localhost:4000';
  }

  const extraUrl =
    typeof Constants.expoConfig?.extra?.apiUrl === 'string'
      ? Constants.expoConfig.extra.apiUrl
      : undefined;
  const envUrl =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : undefined;
  let baseUrl = (envUrl || extraUrl || '').trim();

  const isLocal =
    !baseUrl || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

  // Standalone APK/AAB: env is often missing — use production URL, not localhost.
  if (isLocal && !__DEV__) {
    return PRODUCTION_API_URL;
  }

  if (!baseUrl) baseUrl = 'http://localhost:4000';

  // Dev on physical device: localhost points to the phone — use Metro machine IP.
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    const devHost = getDevMachineHost();
    if (devHost) {
      baseUrl = baseUrl.replace(/localhost|127\.0\.0\.1/g, devHost);
    }
  }

  return baseUrl.replace(/\/$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();
