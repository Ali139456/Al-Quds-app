import { Image } from 'expo-image';
import { resolveFoodImageUri, IMAGE_WIDTH } from '@/utils/resolveFoodImage';

/** Warm image cache for menu/deals — call after API data loads. */
export function prefetchFoodImages(images: (string | undefined)[], limit = 40): void {
  const seen = new Set<string>();
  for (const image of images) {
    if (seen.size >= limit) break;
    const uri = resolveFoodImageUri(image, IMAGE_WIDTH.card);
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    Image.prefetch(uri).catch(() => {});
  }
}
