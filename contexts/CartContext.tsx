import React, { createContext, useContext, useState, useCallback } from 'react';
import type { FoodItem, CartItem, Addon } from '@/types';

export type AddToCartOptions = {
  quantity?: number;
  variety?: string;
  varietyPriceModifier?: number;
  addons?: Addon[];
};

type CartContextType = {
  items: CartItem[];
  addItem: (food: FoodItem, quantity?: number, options?: AddToCartOptions) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getLineKey: (item: CartItem) => string;
};

function getLineKeyFromOptions(foodId: string, variety?: string, addons?: Addon[]): string {
  const addonIds = addons?.map((a) => a.id).sort().join(',') ?? '';
  return `${foodId}|${variety ?? ''}|${addonIds}`;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const getLineKey = useCallback((item: CartItem) => {
    return getLineKeyFromOptions(item.food.id, item.variety, item.addons);
  }, []);

  const addItem = useCallback((food: FoodItem, quantity = 1, options?: AddToCartOptions) => {
    const qty = options?.quantity ?? quantity;
    const variety = options?.variety;
    const varietyPriceModifier = options?.varietyPriceModifier ?? 0;
    const addons = options?.addons ?? [];
    const addonsTotal = addons.reduce((s, a) => s + a.price, 0);
    const unitPrice = food.price + varietyPriceModifier + addonsTotal;

    setItems((prev) => {
      const key = getLineKeyFromOptions(food.id, variety, addons);
      const existing = prev.find(
        (i) => getLineKeyFromOptions(i.food.id, i.variety, i.addons) === key
      );
      if (existing) {
        return prev.map((i) =>
          getLineKeyFromOptions(i.food.id, i.variety, i.addons) === key
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [
        ...prev,
        {
          food,
          quantity: qty,
          unitPrice,
          variety,
          varietyPriceModifier,
          addons: addons.length > 0 ? addons : undefined,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setItems((prev) => prev.filter((i) => getLineKeyFromOptions(i.food.id, i.variety, i.addons) !== lineKey));
  }, []);

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => getLineKeyFromOptions(i.food.id, i.variety, i.addons) !== lineKey));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        getLineKeyFromOptions(i.food.id, i.variety, i.addons) === lineKey ? { ...i, quantity } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + (i.unitPrice ?? i.food.price) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        getLineKey,
      }}
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
