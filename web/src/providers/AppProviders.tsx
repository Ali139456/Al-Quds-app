'use client';

import { CartProvider } from '@/providers/CartProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { SettingsProvider } from '@/providers/SettingsProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
