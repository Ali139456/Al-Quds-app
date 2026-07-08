'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { AppSettings } from '@/lib/types';

const DEFAULT_SETTINGS: AppSettings = {
  freeDeliveryMin: 1500,
  defaultDeliveryFee: 0,
  storeOpen: true,
  busyMode: false,
  deliveryTimeMin: 25,
  deliveryTimeMax: 40,
};

type SettingsContextType = {
  settings: AppSettings;
  refresh: () => Promise<void>;
  getDeliveryFee: (subtotal: number, freeDelivery?: boolean) => number;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<AppSettings>('/api/settings');
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  const getDeliveryFee = useCallback(
    (subtotal: number, freeDelivery?: boolean) => {
      if (freeDelivery) return 0;
      if (subtotal >= settings.freeDeliveryMin) return 0;
      return settings.defaultDeliveryFee;
    },
    [settings]
  );

  return (
    <SettingsContext.Provider value={{ settings, refresh, getDeliveryFee }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
