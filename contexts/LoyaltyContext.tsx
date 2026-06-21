import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { LoyaltyInfo } from '@/types';
import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT: LoyaltyInfo = {
  points: 0,
  lifetimePoints: 0,
  isPro: false,
  referralCode: '',
  walletBalance: 0,
};

type LoyaltyContextType = {
  loyalty: LoyaltyInfo;
  refreshLoyalty: () => Promise<void>;
  calcPointsEarned: (total: number) => number;
};

const LoyaltyContext = createContext<LoyaltyContextType | null>(null);

export function LoyaltyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyInfo>(DEFAULT);

  const refreshLoyalty = useCallback(async () => {
    if (!API_BASE_URL || !user) {
      setLoyalty(DEFAULT);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/loyalty/${encodeURIComponent(user.id)}`);
      if (res.ok) setLoyalty(await res.json());
    } catch (_) {}
  }, [user?.id]);

  useEffect(() => {
    refreshLoyalty();
  }, [refreshLoyalty]);

  const calcPointsEarned = useCallback((total: number) => Math.floor(total / 100) * 5, []);

  const value = useMemo(
    () => ({ loyalty, refreshLoyalty, calcPointsEarned }),
    [loyalty, refreshLoyalty, calcPointsEarned]
  );

  return <LoyaltyContext.Provider value={value}>{children}</LoyaltyContext.Provider>;
}

export function useLoyalty() {
  const ctx = useContext(LoyaltyContext);
  if (!ctx) throw new Error('useLoyalty must be used within LoyaltyProvider');
  return ctx;
}
