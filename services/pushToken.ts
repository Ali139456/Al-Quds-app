import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/api';

export async function syncPushTokenToBackend(userId: string, token: string | null): Promise<void> {
  if (!API_BASE_URL || !token || !userId) return;
  try {
    await fetch(`${API_BASE_URL}/api/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        token,
        platform: Platform.OS,
      }),
    });
  } catch (_) {}
}
