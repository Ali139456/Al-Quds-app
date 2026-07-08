'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, FoodItem, Addon } from '@/lib/types';

type CartContextType = {
  items: CartItem[];
  addItem: (food: FoodItem, qty: number, unitPrice: number, variety?: string, addons?: Addon[]) => void;
  updateQty: (lineKey: string, qty: number) => void;
  removeItem: (lineKey: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = 'alquds_web_cart';

function makeLineKey(foodId: string, variety?: string, addons?: Addon[]) {
  const addonIds = (addons || []).map((a) => a.id).sort().join(',');
  return `${foodId}|${variety || ''}|${addonIds}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(
    (food: FoodItem, qty: number, unitPrice: number, variety?: string, addons?: Addon[]) => {
      const lineKey = makeLineKey(food.id, variety, addons);
      setItems((prev) => {
        const existing = prev.find((i) => i.lineKey === lineKey);
        if (existing) {
          return prev.map((i) =>
            i.lineKey === lineKey ? { ...i, quantity: i.quantity + qty } : i
          );
        }
        return [...prev, { food, quantity: qty, unitPrice, variety, addons, lineKey }];
      });
    },
    []
  );

  const updateQty = useCallback((lineKey: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.lineKey !== lineKey));
      return;
    }
    setItems((prev) => prev.map((i) => (i.lineKey === lineKey ? { ...i, quantity: qty } : i)));
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setItems((prev) => prev.filter((i) => i.lineKey !== lineKey));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
