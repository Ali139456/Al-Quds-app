'use client';

import { CartProvider } from '@/providers/CartProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { SettingsProvider } from '@/providers/SettingsProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
