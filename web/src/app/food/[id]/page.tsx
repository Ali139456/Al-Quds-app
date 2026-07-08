'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import type { FoodItem, Addon } from '@/lib/types';
import { formatPKR, resolveImageUrl } from '@/lib/utils';
import { useCart } from '@/providers/CartProvider';

export default function FoodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const [food, setFood] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState(1);
  const [variety, setVariety] = useState<string | undefined>();
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);

  useEffect(() => {
    apiFetch<FoodItem[]>('/api/menu')
      .then((items) => setFood(items.find((i) => i.id === id) || null))
      .catch(() => setFood(null));
  }, [id]);

  if (!food) {
    return <div className="mx-auto max-w-3xl p-8 text-muted">Loading item...</div>;
  }

  const varietyModifier =
    food.varieties?.find((v) => v.name === variety)?.priceModifier ?? 0;
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const unitPrice = food.price + varietyModifier + addonsTotal;

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAdd = () => {
    addItem(food, qty, unitPrice, variety, selectedAddons);
    router.push('/cart');
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
        <Image src={resolveImageUrl(food.image)} alt={food.name} fill className="object-cover" priority />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold">{food.name}</h1>
        <p className="mt-2 text-muted">{food.description}</p>
        <p className="mt-4 text-2xl font-extrabold text-accent-dark">{formatPKR(unitPrice)}</p>

        {food.varieties && food.varieties.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 font-bold">Size</p>
            <div className="flex flex-wrap gap-2">
              {food.varieties.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setVariety(v.name)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold ${variety === v.name ? 'border-accent bg-accent/20' : 'border-border'}`}
                >
                  {v.name}
                  {v.priceModifier > 0 ? ` +${formatPKR(v.priceModifier)}` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {food.addons && food.addons.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 font-bold">Add-ons</p>
            <div className="space-y-2">
              {food.addons.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3">
                  <input
                    type="checkbox"
                    checked={selectedAddons.some((x) => x.id === a.id)}
                    onChange={() => toggleAddon(a)}
                  />
                  <span className="flex-1 font-medium">{a.name}</span>
                  <span className="text-sm font-bold text-accent-dark">+{formatPKR(a.price)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center rounded-xl border border-border">
            <button type="button" className="px-4 py-2 font-bold" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="min-w-8 text-center font-bold">{qty}</span>
            <button type="button" className="px-4 py-2 font-bold" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
          <button type="button" className="btn-primary flex-1" onClick={handleAdd} disabled={food.stockAvailable === false}>
            Add to cart · {formatPKR(unitPrice * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
