import type { OrderStatus } from '@/types';

export type RiderStatusKey = OrderStatus | 'cancelled';

export const RIDER_STATUS: Record<
  string,
  { label: string; color: string; icon: 'clock-o' | 'check' | 'fire' | 'motorcycle' | 'smile-o' | 'ban' }
> = {
  placed: { label: 'New', color: '#F59E0B', icon: 'clock-o' },
  confirmed: { label: 'Confirmed', color: '#D1AB66', icon: 'check' },
  preparing: { label: 'Preparing', color: '#D1AB66', icon: 'fire' },
  out_for_delivery: { label: 'On the way', color: '#60A5FA', icon: 'motorcycle' },
  delivered: { label: 'Delivered', color: '#4ADE80', icon: 'smile-o' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF', icon: 'ban' },
};

export function getRiderStatus(status: string) {
  return RIDER_STATUS[status] ?? { label: status.replace(/_/g, ' '), color: '#9CA3AF', icon: 'clock-o' as const };
}
