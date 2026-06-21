import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { API_BASE_URL } from '@/constants/api';

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  sortOrder: number;
}

const DEFAULT_BANNERS: Banner[] = [
  { id: 0, title: 'Al-Quds', subtitle: 'Fried · Burgers · Arabian · Chinese · Pasta', image: '🍔', link: '', sortOrder: 0 },
  { id: -1, title: 'Order now', subtitle: 'Delivery & pickup. Fresh ingredients.', image: '🛵', link: '', sortOrder: 1 },
];

function mapBanners(data: unknown): Banner[] {
  if (!Array.isArray(data) || data.length === 0) return DEFAULT_BANNERS;
  return data.map((r: { id: number; title?: string; subtitle?: string; image?: string; link?: string; sortOrder?: number }) => ({
    id: r.id,
    title: r.title ?? '',
    subtitle: r.subtitle ?? '',
    image: r.image ?? '🖼️',
    link: r.link ?? '',
    sortOrder: r.sortOrder ?? 0,
  }));
}

export function useBanners(refreshTrigger?: number): Banner[] {
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);

  const fetchBanners = useCallback(() => {
    if (!API_BASE_URL) return;
    fetch(API_BASE_URL + '/api/banners')
      .then((res) => res.json())
      .then((data) => setBanners(mapBanners(data)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners, refreshTrigger]);

  // Refetch when app comes back to foreground (e.g. reopen app on mobile)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') fetchBanners();
    });
    return () => sub.remove();
  }, [fetchBanners]);

  return banners;
}
