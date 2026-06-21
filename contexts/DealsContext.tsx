import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/constants/api';
import type { Deal, FoodItem } from '@/types';
import { prefetchFoodImages } from '@/utils/prefetchFoodImages';

type DealsContextType = {
  deals: Deal[];
  isLoading: boolean;
  refreshDeals: () => void;
  getDealById: (id: string) => Deal | undefined;
};

const DealsContext = createContext<DealsContextType | null>(null);

function mapApiDeal(raw: Record<string, unknown>): Deal {
  const items = Array.isArray(raw.items)
    ? (raw.items as Record<string, unknown>[]).map(
        (item): FoodItem => ({
          id: String(item.id ?? ''),
          name: String(item.name ?? ''),
          description: String(item.description ?? ''),
          price: Number(item.price) || 0,
          category: String(item.category ?? 'burgers'),
          image: String(item.image ?? '🍔'),
          rating: Number(item.rating) || 4.5,
          prepTime: Number(item.prepTime ?? item.prep_time) || 15,
          varieties: Array.isArray(item.varieties) ? item.varieties : undefined,
          addons: Array.isArray(item.addons) ? item.addons : undefined,
        })
      )
    : [];

  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    subtitle: String(raw.subtitle ?? ''),
    description: String(raw.description ?? ''),
    image: String(raw.image ?? '🎁'),
    dealPrice: Number(raw.dealPrice ?? raw.deal_price) || 0,
    originalPrice: Number(raw.originalPrice ?? raw.original_price) || 0,
    menuItemIds: Array.isArray(raw.menuItemIds)
      ? raw.menuItemIds.map(String)
      : Array.isArray(raw.menu_item_ids)
        ? raw.menu_item_ids.map(String)
        : [],
    badge: String(raw.badge ?? ''),
    sortOrder: Number(raw.sortOrder ?? raw.sort_order) || 0,
    items,
    stockAvailable: raw.stockAvailable !== false,
    stockMaxQty: raw.stockMaxQty != null ? Number(raw.stockMaxQty) : undefined,
    stockReason: raw.stockReason != null ? String(raw.stockReason) : null,
  };
}

export function DealsProvider({ children }: { children: React.ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDeals = useCallback(() => {
    if (!API_BASE_URL) {
      setDeals([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetch(`${API_BASE_URL}/api/deals`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map(mapApiDeal).sort((a, b) => a.sortOrder - b.sortOrder);
          setDeals(mapped);
          prefetchFoodImages(mapped.map((d) => d.image));
        }
      })
      .catch(() => setDeals([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refreshDeals();
  }, [refreshDeals]);

  const getDealById = useCallback((id: string) => deals.find((d) => d.id === id), [deals]);

  return (
    <DealsContext.Provider value={{ deals, isLoading, refreshDeals, getDealById }}>
      {children}
    </DealsContext.Provider>
  );
}

export function useDeals() {
  const ctx = useContext(DealsContext);
  if (!ctx) throw new Error('useDeals must be used within DealsProvider');
  return ctx;
}
