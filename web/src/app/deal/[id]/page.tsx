'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import type { Deal } from '@/lib/types';
import { formatPKR, resolveImageUrl } from '@/lib/utils';
import { useCart } from '@/providers/CartProvider';

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, clearCart } = useCart();
  const [deal, setDeal] = useState<Deal | null>(null);

  useEffect(() => {
    apiFetch<Deal>(`/api/deals/${id}`).then(setDeal).catch(() => setDeal(null));
  }, [id]);

  if (!deal) {
    return <div className="mx-auto max-w-3xl p-8 text-muted">Loading deal...</div>;
  }

  const handleAddDeal = () => {
    if (!deal.items?.length) return;
    clearCart();
    for (const item of deal.items) {
      addItem(item, 1, item.price);
    }
    router.push('/cart');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="card overflow-hidden">
        <div className="relative h-56 md:h-72">
          <Image src={resolveImageUrl(deal.image)} alt={deal.title} fill className="object-cover" />
        </div>
        <div className="p-6">
          {deal.badge && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-stone-900">{deal.badge}</span>
          )}
          <h1 className="mt-2 text-3xl font-extrabold">{deal.title}</h1>
          {deal.subtitle && <p className="mt-1 text-muted">{deal.subtitle}</p>}
          {deal.description && <p className="mt-3 text-sm leading-relaxed">{deal.description}</p>}
          <div className="mt-4 flex items-end gap-3">
            <span className="text-2xl font-extrabold text-accent-dark">{formatPKR(deal.dealPrice)}</span>
            <span className="text-lg text-muted line-through">{formatPKR(deal.originalPrice)}</span>
          </div>
          {deal.items && deal.items.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {deal.items.map((i) => (
                <li key={i.id}>• {i.name}</li>
              ))}
            </ul>
          )}
          <button type="button" className="btn-primary mt-6 w-full md:w-auto" onClick={handleAddDeal}>
            Add deal to cart
          </button>
        </div>
      </div>
    </div>
  );
}
