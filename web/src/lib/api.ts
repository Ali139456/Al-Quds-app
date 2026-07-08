export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'https://al-quds-app-production.up.railway.app').replace(/\/$/, '');

export const BRAND_NAME = 'Al-Quds';
export const BRAND_GOLD = '#D1AB66';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
