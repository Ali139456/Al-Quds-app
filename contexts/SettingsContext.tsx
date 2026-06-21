import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppSettings } from '@/types';
import { API_BASE_URL } from '@/constants/api';

const DEFAULTS: AppSettings = {
  freeDeliveryMin: 1500,
  defaultDeliveryFee: 0,
  storeOpen: true,
  busyMode: false,
  busyExtraMins: 15,
  deliveryTimeMin: 25,
  deliveryTimeMax: 40,
  loyaltyPointsPer100: 5,
  referralBonus: 100,
  proMonthlyFee: 299,
  partialAdvancePercent: 50,
  supportWhatsapp: '03175858934',
  supportPhone: '03175858934',
  deliveryZones: [],
  promotions: [],
};

type SettingsContextType = {
  settings: AppSettings;
  refreshSettings: () => Promise<void>;
  getDeliveryFee: (subtotal: number, couponFreeDelivery?: boolean) => number;
  getDeliveryEta: () => string;
  getAutoPromotion: (subtotal: number) => { title: string; discount: number; freeDelivery: boolean } | null;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  const refreshSettings = useCallback(async () => {
    if (!API_BASE_URL) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`);
      if (res.ok) setSettings({ ...DEFAULTS, ...(await res.json()) });
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshSettings();
    const timer = setInterval(refreshSettings, 15000);
    return () => clearInterval(timer);
  }, [refreshSettings]);

  const getDeliveryFee = useCallback(
    (subtotal: number, couponFreeDelivery?: boolean) => {
      if (couponFreeDelivery) return 0;
      const freePromo = settings.promotions.find((p) => p.type === 'free_delivery' && subtotal >= p.minOrder);
      if (freePromo || subtotal >= settings.freeDeliveryMin) return 0;
      return settings.defaultDeliveryFee;
    },
    [settings]
  );

  const getDeliveryEta = useCallback(() => {
    const min = settings.deliveryTimeMin + (settings.busyMode ? settings.busyExtraMins : 0);
    const max = settings.deliveryTimeMax + (settings.busyMode ? settings.busyExtraMins : 0);
    return `${min}–${max} min`;
  }, [settings]);

  const getAutoPromotion = useCallback(
    (subtotal: number) => {
      const promo = settings.promotions.find((p) => p.type === 'free_delivery' && subtotal >= p.minOrder);
      if (promo) return { title: promo.title, discount: 0, freeDelivery: true };
      return null;
    },
    [settings]
  );

  const value = useMemo(
    () => ({ settings, refreshSettings, getDeliveryFee, getDeliveryEta, getAutoPromotion }),
    [settings, refreshSettings, getDeliveryFee, getDeliveryEta, getAutoPromotion]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
