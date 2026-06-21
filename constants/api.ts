import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
  const envUrl =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : undefined;
  let baseUrl = envUrl || 'http://localhost:4000';

  // On a physical device, localhost points to the phone — use the Metro dev machine IP instead.
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    const devHost = getDevMachineHost();
    if (devHost) {
      baseUrl = baseUrl.replace(/localhost|127\.0\.0\.1/g, devHost);
    }
  }
  return baseUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();
