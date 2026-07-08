'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { formatPKR } from '@/lib/utils';

const STEPS = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const;

export default function OrderDetailClient() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const placed = searchParams.get('placed') === '1';
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    apiFetch<Record<string, unknown>>(`/api/orders/${id}`)
      .then(setOrder)
      .catch(() => {
        const local = JSON.parse(localStorage.getItem('alquds_web_orders') || '[]');
        setOrder(local.find((o: { id: string }) => o.id === id) || null);
      });
  }, [id]);

  if (!order) {
    return <div className="mx-auto max-w-2xl p-8 text-muted">Loading order...</div>;
  }

  const status = String(order.status || 'placed');
  const stepIndex = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {placed && (
        <div className="mb-6 rounded-2xl bg-green-50 px-4 py-4 text-center">
          <p className="text-lg font-extrabold text-green-800">Order placed successfully!</p>
          <p className="mt-1 text-sm text-green-700">Admin has received your order. Track status below.</p>
        </div>
      )}

      <h1 className="text-2xl font-extrabold">Order #{String(order.id).replace('order_', '')}</h1>
      <p className="mt-1 text-muted">{String(order.address_line || '')}</p>
      <p className="mt-4 text-2xl font-extrabold text-accent-dark">{formatPKR(Number(order.total) || 0)}</p>

      <div className="card mt-6 p-4">
        <h2 className="mb-4 font-bold">Order status</h2>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i <= stepIndex ? 'bg-accent text-stone-900' : 'bg-stone-200 text-muted'}`}>
                {i + 1}
              </div>
              <span className={`font-semibold capitalize ${i <= stepIndex ? 'text-foreground' : 'text-muted'}`}>
                {step.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {Array.isArray(order.items) && order.items.length > 0 && (
        <div className="card mt-4 p-4">
          <h2 className="mb-3 font-bold">Items</h2>
          <ul className="space-y-2 text-sm">
            {(order.items as { name: string; quantity: number; price: number }[]).map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-semibold">{formatPKR(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/orders" className="btn-secondary mt-6 inline-flex">All orders</Link>
    </div>
  );
}
