'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useInterval } from '@/hooks/useInterval';
import type { PastOrder, OrderStatus } from '@/lib/types';
import { formatPKR } from '@/lib/utils';

function mapApiOrder(row: Record<string, unknown>): PastOrder {
  return {
    id: String(row.id),
    userId: String(row.user_id || ''),
    total: Number(row.total) || 0,
    addressLabel: String(row.address_label || ''),
    addressLine: String(row.address_line || ''),
    status: String(row.status || 'placed') as OrderStatus,
    createdAt: String(row.created_at || ''),
    items: [],
    paymentMethod: row.payment_method ? String(row.payment_method) : undefined,
  };
}

const STATUS_LABELS: Record<string, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PastOrder[]>([]);

  const loadOrders = useCallback(async () => {
    const local: PastOrder[] = JSON.parse(localStorage.getItem('alquds_web_orders') || '[]');
    if (!user?.id) {
      setOrders(local);
      return;
    }
    try {
      const rows = await apiFetch<Record<string, unknown>[]>(`/api/orders?userId=${encodeURIComponent(user.id)}`);
      const fromApi = rows.map(mapApiOrder);
      const byId = new Map<string, PastOrder>();
      for (const o of local) byId.set(o.id, o);
      for (const o of fromApi) byId.set(o.id, o);
      setOrders(
        Array.from(byId.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch {
      setOrders(local);
    }
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useInterval(loadOrders, 5000, !!user?.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">My orders</h1>
      {!user && <p className="mt-2 text-sm text-muted">Guest orders on this device are shown below. <Link href="/auth/login" className="font-bold text-accent-dark">Login</Link> to sync across devices.</p>}

      {orders.length === 0 ? (
        <div className="mt-12 text-center text-muted">
          <p>No orders yet.</p>
          <Link href="/menu" className="btn-primary mt-4 inline-flex">Order now</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <Link key={o.id} href={`/order/${o.id}`} className="card block p-4 transition hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-extrabold">Order #{o.id.replace('order_', '')}</p>
                  <p className="mt-1 text-sm text-muted">{o.addressLine}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent-dark">
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                  <p className="mt-2 font-extrabold text-accent-dark">{formatPKR(o.total)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
