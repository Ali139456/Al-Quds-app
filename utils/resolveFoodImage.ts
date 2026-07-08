import { API_BASE_URL } from '@/constants/api';

export const IMAGE_WIDTH = {
  thumb: 200,
  card: 420,
  deal: 520,
  banner: 960,
  detail: 900,
} as const;

/** Turn emoji, filename, or path into a loadable image URI (resized for speed). */
export function resolveFoodImageUri(image?: string, width: number = IMAGE_WIDTH.card): string | null {
  if (!image) return null;
  let url: string | null = null;
  if (image.startsWith('http://') || image.startsWith('https://')) url = image;
  else if (image.startsWith('/uploads/')) url = `${API_BASE_URL}${image}`;
  else if (/\.(jpg|jpeg|png|webp)$/i.test(image)) url = `${API_BASE_URL}/uploads/menu/${image}`;
  else return null;

  if (url.includes('/uploads/')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}w=${width}&q=75`;
  }
  return url;
}

export function isFoodImageUrl(image?: string): boolean {
  return resolveFoodImageUri(image) != null;
}
