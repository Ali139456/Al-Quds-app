import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/api';

type UserProfile = {
  email?: string;
  name?: string;
  phone?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureUserOnBackend(userId: string, profile: UserProfile): Promise<void> {
  if (!API_BASE_URL || !profile.email) return;
  try {
    await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userId,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
      }),
    });
  } catch (_) {}
}

export async function syncPushTokenToBackend(
  userId: string,
  token: string | null,
  profile?: UserProfile
): Promise<boolean> {
  if (!API_BASE_URL || !token || !userId) return false;

  if (profile?.email) {
    await ensureUserOnBackend(userId, profile);
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          token,
          platform: Platform.OS,
        }),
      });
      if (res.ok) return true;
      console.warn('Push token sync failed:', res.status, await res.text().catch(() => ''));
    } catch (e) {
      console.warn('Push token sync error:', e);
    }
    if (attempt < 2) await sleep(1000 * (attempt + 1));
  }
  return false;
}
