'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { RemoteImage } from '@/components/RemoteImage';
import { apiFetch } from '@/lib/api';
import type { FoodItem, Addon } from '@/lib/types';
import { formatPKR, IMAGE_WIDTH, resolveImageUrl } from '@/lib/utils';
import { useCart } from '@/providers/CartProvider';

export default function FoodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, totalItems } = useCart();
  const [food, setFood] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState(1);
  const [variety, setVariety] = useState<string | undefined>();
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    apiFetch<FoodItem[]>('/api/menu')
      .then((items) => setFood(items.find((i) => i.id === id) || null))
      .catch(() => setFood(null));
  }, [id]);

  if (!food) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 p-16 text-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-accent/30" />
        <p className="text-muted">Loading item...</p>
      </div>
    );
  }

  const varietyModifier = food.varieties?.find((v) => v.name === variety)?.priceModifier ?? 0;
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const unitPrice = food.price + varietyModifier + addonsTotal;
  const outOfStock = food.stockAvailable === false;

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(food, qty, unitPrice, variety, selectedAddons);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <Link
        href="/menu"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-accent-dark"
      >
        ← Back to menu
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative">
          <div className="card overflow-hidden p-2 shadow-lg shadow-black/5">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-900">
              <RemoteImage
                src={resolveImageUrl(food.image, { w: IMAGE_WIDTH.detail })}
                alt={food.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/20 via-transparent to-accent/10 blur-2xl" />
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-dark">
              {food.category}
            </span>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-muted">
              ★ {food.rating?.toFixed(1) || '4.5'}
            </span>
            {outOfStock && (
              <span className="rounded-full bg-red-600/15 px-3 py-1 text-xs font-bold text-red-600">
                Out of stock
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{food.name}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">{food.description}</p>

          <div className="mt-5 inline-flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-accent-dark">{formatPKR(unitPrice)}</span>
            {unitPrice !== food.price && (
              <span className="text-sm text-muted line-through">{formatPKR(food.price)}</span>
            )}
          </div>

          {food.varieties && food.varieties.length > 0 && (
            <section className="card mt-8 p-5">
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-muted">Choose size</h2>
              <div className="flex flex-wrap gap-2">
                {food.varieties.map((v) => {
                  const active = variety === v.name;
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setVariety(v.name)}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        active
                          ? 'border-accent bg-accent/20 text-foreground shadow-sm'
                          : 'border-border bg-card hover:border-accent/40'
                      }`}
                    >
                      {v.name}
                      {v.priceModifier > 0 ? ` +${formatPKR(v.priceModifier)}` : ''}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {food.addons && food.addons.length > 0 && (
            <section className="card mt-4 p-5">
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-muted">Add-ons</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {food.addons.map((a) => {
                  const checked = selectedAddons.some((x) => x.id === a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAddon(a)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        checked
                          ? 'border-accent bg-accent/10 shadow-sm'
                          : 'border-border bg-card hover:border-accent/30'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                          checked ? 'border-accent bg-accent text-stone-900' : 'border-border'
                        }`}
                      >
                        {checked ? '✓' : ''}
                      </span>
                      <span className="flex-1 text-sm font-medium">{a.name}</span>
                      <span className="text-sm font-bold text-accent-dark">+{formatPKR(a.price)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <div className="card mt-8 hidden p-4 md:block">
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl border border-border bg-card">
                <button
                  type="button"
                  className="px-4 py-3 font-bold text-muted transition hover:text-foreground"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="min-w-10 text-center text-lg font-extrabold">{qty}</span>
                <button
                  type="button"
                  className="px-4 py-3 font-bold text-muted transition hover:text-foreground"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className={`btn-primary flex-1 !py-3.5 ${added ? '!from-green-600 !to-green-700 !text-white' : ''}`}
                onClick={handleAdd}
                disabled={outOfStock}
              >
                {added ? 'Added to cart ✓' : `Add to cart · ${formatPKR(unitPrice * qty)}`}
              </button>
              {totalItems > 0 && (
                <button
                  type="button"
                  className="btn-secondary !px-4 !py-3.5"
                  onClick={() => router.push('/cart')}
                >
                  Cart ({totalItems})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-header fixed inset-x-0 bottom-0 z-40 border-t border-border p-4 md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex items-center rounded-xl border border-border bg-card">
            <button
              type="button"
              className="px-3 py-2.5 font-bold"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="min-w-8 text-center font-bold">{qty}</span>
            <button type="button" className="px-3 py-2.5 font-bold" onClick={() => setQty((q) => q + 1)}>
              +
            </button>
          </div>
          <button
            type="button"
            className={`btn-primary flex-1 !py-3 ${added ? '!from-green-600 !to-green-700 !text-white' : ''}`}
            onClick={handleAdd}
            disabled={outOfStock}
          >
            {added ? 'Added ✓' : `Add · ${formatPKR(unitPrice * qty)}`}
          </button>
        </div>
      </div>
      <div className="h-24 md:hidden" />
    </div>
  );
}
