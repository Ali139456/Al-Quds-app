import React, { createContext, useContext, useState } from 'react';
import type { NotificationPermissionStatus } from '@/services/notifications';

type PushNotificationsContextType = {
  expoPushToken: string | null;
  permissionStatus: NotificationPermissionStatus;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  refreshToken: () => Promise<void>;
};

const PushNotificationsContext = createContext<PushNotificationsContextType | null>(null);

export function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken] = useState<string | null>(null);
  const [permissionStatus] = useState<NotificationPermissionStatus>('denied');
  const [isLoading] = useState(false);

  const refreshToken = async () => {};
  const requestPermission = async () => {};

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
