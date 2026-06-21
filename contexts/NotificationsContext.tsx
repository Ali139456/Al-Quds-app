import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

export type InboxNotification = {
  id: number;
  title: string;
  body: string;
  read: number;
  created_at: string;
};

type NotificationsContextType = {
  notifications: InboxNotification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

function mapRow(raw: Record<string, unknown>): InboxNotification {
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ''),
    body: String(raw.body ?? ''),
    read: Number(raw.read) || 0,
    created_at: String(raw.created_at ?? ''),
  };
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (!user?.id || !API_BASE_URL) {
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data.map(mapRow));
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const markRead = useCallback(
    async (id: number) => {
      if (!API_BASE_URL) return;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: 1 } : n)));
      try {
        await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: 'PATCH' });
      } catch {
        refreshNotifications();
      }
    },
    [refreshNotifications]
  );

  const markAllRead = useCallback(async () => {
    if (!user?.id || !API_BASE_URL) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch {
      refreshNotifications();
    }
  }, [refreshNotifications, user?.id]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshNotifications();
    });
    return () => sub.remove();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!user?.id) return;
    const timer = setInterval(refreshNotifications, 30000);
    return () => clearInterval(timer);
  }, [refreshNotifications, user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
