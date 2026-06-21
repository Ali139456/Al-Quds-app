import { API_BASE_URL } from '@/constants/api';

/** Turn emoji, filename, or path into a loadable image URI. */
export function resolveFoodImageUri(image?: string): string | null {
  if (!image) return null;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (image.startsWith('/uploads/')) return `${API_BASE_URL}${image}`;
  if (/\.(jpg|jpeg|png|webp)$/i.test(image)) return `${API_BASE_URL}/uploads/menu/${image}`;
  return null;
}

export function isFoodImageUrl(image?: string): boolean {
  return resolveFoodImageUri(image) != null;
}
