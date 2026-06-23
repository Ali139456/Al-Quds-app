import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { PastOrder, PastOrderItem } from '@/types';
import type { CartItem } from '@/types';
import type { SavedAddress } from '@/types';
import { getStoredOrders, setStoredOrders } from '@/utils/storage';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/constants/api';
import { isAddressInDeliveryZone, DELIVERY_ZONE_OUT_MESSAGE } from '@/constants/location';
import { toast } from '@/contexts/ToastContext';

export type CheckoutDetails = {
  customerName: string;
  customerPhone: string;
  paymentMethod?: string;
  couponCode?: string;
  couponId?: string;
  discountAmount?: number;
  deliveryFee?: number;
  subtotal?: number;
  scheduledAt?: string;
  contactless?: boolean;
  specialInstructions?: string;
  paymentProofUrl?: string;
  tipAmount?: number;
  walletUsed?: number;
  loyaltyPointsEarned?: number;
};

type OrderHistoryContextType = {
  orders: PastOrder[];
  isLoading: boolean;
  addOrder: (items: CartItem[], total: number, address: SavedAddress, details?: CheckoutDetails) => Promise<void>;
  refreshOrderHistory: () => Promise<void>;
};

const OrderHistoryContext = createContext<OrderHistoryContextType | null>(null);

function mapApiOrderToPastOrder(r: {
  id: string;
  user_id: string;
  total: number;
  address_label: string;
  address_line: string;
  status: string;
  created_at: string;
  rating?: number | null;
  rating_comment?: string | null;
}): PastOrder {
  return {
    id: r.id,
    userId: r.user_id,
    items: [],
    total: r.total,
    addressLabel: r.address_label,
    addressLine: r.address_line,
    status: r.status as PastOrder['status'],
    createdAt: r.created_at,
    rating: r.rating != null ? Number(r.rating) : undefined,
    ratingComment: r.rating_comment || undefined,
  };
}

export function OrderHistoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const previousStatusByOrderId = useRef<Record<string, string>>({});

  const mergeOrders = useCallback((local: PastOrder[], fromApi: PastOrder[]): PastOrder[] => {
    const byId = new Map<string, PastOrder>();
    for (const o of local) byId.set(o.id, o);
    for (const o of fromApi) {
      const prev = byId.get(o.id) || o;
      byId.set(o.id, {
        ...prev,
        status: o.status,
        createdAt: o.createdAt,
        rating: o.rating ?? prev.rating,
        ratingComment: o.ratingComment ?? prev.ratingComment,
      });
    }
    const merged = Array.from(byId.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged;
  }, []);

  const fetchOrdersFromApi = useCallback(async (): Promise<PastOrder[]> => {
    if (!API_BASE_URL || !user) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders?userId=${encodeURIComponent(user.id)}`);
      if (!res.ok) return [];
      const rows = await res.json();
      return (rows || []).map(mapApiOrderToPastOrder);
    } catch (_) {
      return [];
    }
  }, [user?.id]);

  const refreshOrderHistory = useCallback(async () => {
    const local = await getStoredOrders();
    const fromApi = await fetchOrdersFromApi();
    const merged = mergeOrders(local, fromApi);
    const statusesNow: Record<string, string> = {};
    merged.forEach((o) => (statusesNow[o.id] = o.status));
    const prev = previousStatusByOrderId.current;
    const deliveredIds = merged.filter((o) => o.status === 'delivered' && prev[o.id] && prev[o.id] !== 'delivered').map((o) => o.id);
    previousStatusByOrderId.current = statusesNow;
    setOrders(merged);
    await setStoredOrders(merged);
    if (deliveredIds.length > 0) {
      const msg = deliveredIds.length === 1 ? 'Your order has been delivered!' : `${deliveredIds.length} of your orders have been delivered!`;
      toast.success(msg, 'Order delivered');
    }
  }, [fetchOrdersFromApi, mergeOrders]);

  useEffect(() => {
    let cancelled = false;
    getStoredOrders().then(async (local) => {
      if (cancelled) return;
      const fromApi = await fetchOrdersFromApi();
      const merged = mergeOrders(local, fromApi);
      merged.forEach((o) => (previousStatusByOrderId.current[o.id] = o.status));
      setOrders(merged);
      if (merged.length) await setStoredOrders(merged);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id, fetchOrdersFromApi, mergeOrders]);

  const rollbackLocalOrder = useCallback(async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    const list = await getStoredOrders();
    await setStoredOrders(list.filter((o) => o.id !== orderId));
  }, []);

  const addOrder = useCallback(
    async (items: CartItem[], total: number, address: SavedAddress, details?: CheckoutDetails) => {
      if (!isAddressInDeliveryZone(address)) {
        throw new Error(DELIVERY_ZONE_OUT_MESSAGE);
      }
      if (
        address.latitude == null ||
        address.longitude == null ||
        !Number.isFinite(address.latitude) ||
        !Number.isFinite(address.longitude)
      ) {
        throw new Error('Delivery location coordinates are missing. Please re-select your address.');
      }
      const userId = user?.id ?? 'guest';
      const customerName = details?.customerName ?? user?.name ?? '';
      const customerPhone = details?.customerPhone ?? user?.phone ?? '';
      const orderItems: PastOrderItem[] = items.map((i) => ({
        foodId: i.food.id,
        name: i.food.name,
        price: i.unitPrice,
        quantity: i.quantity,
        variety: i.variety,
        addons: i.addons?.map((a) => a.name).join(', '),
        addonIds: i.addons?.map((a) => a.id),
        image: i.food.image,
      }));
      const order: PastOrder = {
        id: `order_${Date.now()}`,
        userId,
        items: orderItems,
        total,
        subtotal: details?.subtotal ?? total,
        addressLabel: address.label,
        addressLine: address.addressLine,
        status: 'placed',
        createdAt: new Date().toISOString(),
        paymentMethod: details?.paymentMethod,
        couponCode: details?.couponCode,
        discountAmount: details?.discountAmount,
        deliveryFee: details?.deliveryFee,
        scheduledAt: details?.scheduledAt,
        contactless: details?.contactless,
        specialInstructions: details?.specialInstructions,
        paymentProofUrl: details?.paymentProofUrl,
        tipAmount: details?.tipAmount,
        loyaltyPointsEarned: details?.loyaltyPointsEarned,
      };
      const list = await getStoredOrders();
      await setStoredOrders([order, ...list]);
      setOrders((prev) => [order, ...prev]);

      if (API_BASE_URL) {
        if (user) {
          try {
            await fetch(`${API_BASE_URL}/api/users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
              }),
            });
          } catch (_) {}
        }

        try {
          const res = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: order.id,
              userId,
              items: orderItems,
              total,
              subtotal: details?.subtotal ?? total,
              addressLabel: address.label,
              addressLine: address.addressLine,
              latitude: address.latitude,
              longitude: address.longitude,
              customerName,
              customerPhone,
              paymentMethod: details?.paymentMethod,
              couponCode: details?.couponCode,
              couponId: details?.couponId,
              discountAmount: details?.discountAmount ?? 0,
              deliveryFee: details?.deliveryFee ?? 0,
              scheduledAt: details?.scheduledAt,
              contactless: details?.contactless,
              specialInstructions: details?.specialInstructions,
              paymentProofUrl: details?.paymentProofUrl,
              tipAmount: details?.tipAmount ?? 0,
              walletUsed: details?.walletUsed ?? 0,
              loyaltyPointsEarned: details?.loyaltyPointsEarned ?? 0,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const msg = data?.error || 'Could not place order on server.';
            await rollbackLocalOrder(order.id);
            throw new Error(msg);
          }
        } catch (e) {
          if (e instanceof Error) throw e;
          await rollbackLocalOrder(order.id);
          throw new Error('Could not reach server. Check your internet connection.');
        }
      }
    },
    [user, rollbackLocalOrder]
  );

  const userOrders = user ? orders.filter((o) => o.userId === user.id) : orders.filter((o) => o.userId === 'guest');

  return (
    <OrderHistoryContext.Provider
      value={{
        orders: userOrders,
        isLoading,
        addOrder,
        refreshOrderHistory,
      }}
    >
      {children}
    </OrderHistoryContext.Provider>
  );
}

export function useOrderHistory() {
  const ctx = useContext(OrderHistoryContext);
  if (!ctx) throw new Error('useOrderHistory must be used within OrderHistoryProvider');
  return ctx;
}
