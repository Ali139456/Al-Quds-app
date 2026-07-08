'use client';

import { useSettings } from '@/providers/SettingsProvider';

export function StoreClosedBanner() {
  const { settings } = useSettings();
  if (settings.storeOpen) return null;
  return (
    <div className="bg-red-600 px-4 py-2 text-center text-sm font-bold text-white">
      Store is currently closed. You can browse the menu but cannot place orders right now.
    </div>
  );
}
