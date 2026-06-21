import type { OrderStatus } from '@/types';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function formatOrderStatus(status: string): string {
  return ORDER_STATUS_LABELS[status] || status.replace(/_/g, ' ');
}

export function formatEtaMinutes(mins: number): string {
  if (mins <= 1) return 'any minute now';
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

export function getOrderStatusMessage(status: string, etaMinutes?: number | null): string {
  switch (status) {
    case 'placed':
      return 'We received your order. A rider will be assigned shortly.';
    case 'confirmed':
      return 'Rider assigned. Your order is being confirmed at the restaurant.';
    case 'preparing':
      return 'Your food is being prepared. The rider will pick it up soon.';
    case 'out_for_delivery':
      if (etaMinutes != null) {
        return `Rider is on the way! Estimated arrival in ${formatEtaMinutes(etaMinutes)}.`;
      }
      return 'Rider is on the way to your address!';
    case 'delivered':
      return 'Order delivered. Enjoy your meal!';
    case 'cancelled':
      return 'This order was cancelled.';
    default:
      return 'Tracking your order…';
  }
}

export function isActiveOrder(status: string): boolean {
  return !['delivered', 'cancelled'].includes(status);
}

export function isTrackableStatus(status: OrderStatus | string): boolean {
  return isActiveOrder(status);
}
