import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/api';

export async function uploadPaymentProof(file: File | Blob): Promise<string | null> {
  if (!API_BASE_URL) return null;
  const form = new FormData();
  form.append('image', file as Blob);
  const res = await fetch(`${API_BASE_URL}/api/payment-proof`, { method: 'POST', body: form });
  if (!res.ok) return null;
  const data = await res.json();
  const base = API_BASE_URL.replace(/\/$/, '');
  return data.url?.startsWith('http') ? data.url : `${base}${data.url}`;
}

export function pickPaymentImageWeb(): Promise<File | null> {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}
