import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  getPermissionStatus,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { syncPushTokenToBackend } from '@/services/pushToken';

type PushNotificationsContextType = {
  expoPushToken: string | null;
  permissionStatus: NotificationPermissionStatus;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  refreshToken: () => Promise<void>;
};

const PushNotificationsContext = createContext<PushNotificationsContextType | null>(null);

function navigateFromPushData(data: Record<string, unknown> | undefined) {
  if (!data) return;
  const type = data.type;
  if ((type === 'order_update' || type === 'new_order') && data.orderId) {
    router.push(`/order/${String(data.orderId)}` as never);
    return;
  }
  if (type === 'deal' && data.dealId) {
    router.push(`/deal/${String(data.dealId)}` as never);
    return;
  }
  router.push('/notifications' as never);
}

export function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const lastSyncedKey = useRef('');

  const refreshToken = useCallback(async () => {
    const status = await getPermissionStatus();
    setPermissionStatus(status);
    if (status === 'granted') {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
      return token;
    }
    setExpoPushToken(null);
    return null;
  }, []);

  const requestPermission = async () => {
    setIsLoading(true);
    await requestNotificationPermission();
    await refreshToken();
    setIsLoading(false);
  };

  const syncTokenForUser = useCallback(async () => {
    if (!user?.id || !expoPushToken || Platform.OS === 'web') return;
    const key = `${user.id}:${expoPushToken}`;
    if (lastSyncedKey.current === key) return;
    const ok = await syncPushTokenToBackend(user.id, expoPushToken, {
      email: user.email,
      name: user.name,
      phone: user.phone,
    });
    if (ok) lastSyncedKey.current = key;
  }, [user?.id, user?.email, user?.name, user?.phone, expoPushToken]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }
    (async () => {
      await refreshToken();
      setIsLoading(false);
    })();
  }, [refreshToken]);

  useEffect(() => {
    syncTokenForUser();
  }, [syncTokenForUser]);

  useEffect(() => {
    if (Platform.OS === 'web' || !user?.id) return;
    refreshToken().then(() => syncTokenForUser());
  }, [user?.id, refreshToken, syncTokenForUser]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshToken().then(() => syncTokenForUser());
      }
    });
    return () => sub.remove();
  }, [refreshToken, syncTokenForUser]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      navigateFromPushData(data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <PushNotificationsContext.Provider
      value={{
        expoPushToken,
        permissionStatus,
        isLoading,
        requestPermission,
        refreshToken,
      }}
    >
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  const ctx = useContext(PushNotificationsContext);
  if (!ctx) throw new Error('usePushNotifications must be used within PushNotificationsProvider');
  return ctx;
}
