import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AppNotification, RiderOrder } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/constants/api';
import { toast } from '@/contexts/ToastContext';

export type CompletedOrdersParams = {
  search?: string;
  date?: string;
  page?: number;
  limit?: number;
};

export type CompletedOrdersResult = {
  items: RiderOrder[];
  total: number;
  page: number;
  totalPages: number;
};

type RiderContextType = {
  available: RiderOrder[];
  active: RiderOrder[];
  completedCount: number;
  notifications: AppNotification[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  fetchCompletedOrders: (params: CompletedOrdersParams) => Promise<CompletedOrdersResult>;
  acceptOrder: (orderId: string) => Promise<{ ok: boolean; error?: string }>;
  updateOrderStatus: (orderId: string, status: string) => Promise<{ ok: boolean; error?: string }>;
  unreadCount: number;
};

const RiderContext = createContext<RiderContextType | null>(null);

const POLL_MS = 5000;

export function RiderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [available, setAvailable] = useState<RiderOrder[]>([]);
  const [active, setActive] = useState<RiderOrder[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastNotifIdRef = useRef(0);
  const initializedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'rider' || !API_BASE_URL) return;
    setIsLoading(true);
    try {
      const [ordersRes, notifRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/rider/orders?riderId=${encodeURIComponent(user.id)}`),
        fetch(`${API_BASE_URL}/api/notifications?userId=${encodeURIComponent(user.id)}`),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setAvailable(data.available || []);
        setActive(data.active || []);
        setCompletedCount(Number(data.completedCount) || 0);
      }

      if (notifRes.ok) {
        const notifs: AppNotification[] = await notifRes.json();
        setNotifications(notifs);
        const newest = notifs[0];
        if (newest && newest.id > lastNotifIdRef.current) {
          if (initializedRef.current && lastNotifIdRef.current > 0) {
            toast.info(newest.body || '', newest.title);
          }
          lastNotifIdRef.current = newest.id;
        }
        initializedRef.current = true;
      }
    } catch (_) {
      // Backend may be offline
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchCompletedOrders = useCallback(
    async (params: CompletedOrdersParams): Promise<CompletedOrdersResult> => {
      if (!user || !API_BASE_URL) {
        return { items: [], total: 0, page: 1, totalPages: 1 };
      }
      const qs = new URLSearchParams({ riderId: user.id });
      if (params.search) qs.set('search', params.search);
      if (params.date) qs.set('date', params.date);
      if (params.page) qs.set('page', String(params.page));
      if (params.limit) qs.set('limit', String(params.limit));
      const res = await fetch(`${API_BASE_URL}/api/rider/orders/completed?${qs.toString()}`);
      if (!res.ok) throw new Error('Failed to load completed orders');
      const data = await res.json();
      return {
        items: data.items || [],
        total: Number(data.total) || 0,
        page: Number(data.page) || 1,
        totalPages: Number(data.totalPages) || 1,
      };
    },
    [user]
  );

  const acceptOrder = useCallback(
    async (orderId: string) => {
      if (!user || !API_BASE_URL) return { ok: false, error: 'Not logged in' };
      try {
        const res = await fetch(`${API_BASE_URL}/api/rider/orders/${orderId}/accept`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ riderId: user.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.error || 'Could not accept order' };
        await refresh();
        toast.success('Order accepted — head to the restaurant!', 'Accepted');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error' };
      }
    },
    [user, refresh]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      if (!user || !API_BASE_URL) return { ok: false, error: 'Not logged in' };
      try {
        const res = await fetch(`${API_BASE_URL}/api/rider/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ riderId: user.id, status }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.error || 'Could not update status' };
        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error' };
      }
    },
    [user, refresh]
  );

  useEffect(() => {
    if (user?.role !== 'rider') {
      setAvailable([]);
      setActive([]);
      setCompletedCount(0);
      setNotifications([]);
      lastNotifIdRef.current = 0;
      initializedRef.current = false;
      return;
    }
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [user, refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <RiderContext.Provider
      value={{
        available,
        active,
        completedCount,
        notifications,
        isLoading,
        refresh,
        fetchCompletedOrders,
        acceptOrder,
        updateOrderStatus,
        unreadCount,
      }}
    >
      {children}
    </RiderContext.Provider>
  );
}

export function useRider() {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error('useRider must be used within RiderProvider');
  return ctx;
}
