import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/constants/api';

export type OrderTrackingData = {
  orderId: string;
  status: string;
  addressLine: string;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  riderId: string | null;
  riderLatitude: number | null;
  riderLongitude: number | null;
  riderLocationUpdatedAt: string | null;
};

const POLL_MS = 4000;

export function useOrderTracking(orderId: string | undefined, enabled: boolean) {
  const [tracking, setTracking] = useState<OrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!orderId || !API_BASE_URL || !enabled) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/tracking`);
      if (res.ok) {
        setTracking(await res.json());
      }
    } catch (_) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [orderId, enabled]);

  useEffect(() => {
    if (!enabled || !orderId) {
      setTracking(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    refresh();
    intervalRef.current = setInterval(refresh, POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId, enabled, refresh]);

  return { tracking, isLoading, refresh };
}
