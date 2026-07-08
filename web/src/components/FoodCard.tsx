'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RemoteImage } from '@/components/RemoteImage';
import type { FoodItem } from '@/lib/types';
import { formatPKR, IMAGE_WIDTH, resolveImageUrl } from '@/lib/utils';
import { useCart } from '@/providers/CartProvider';

export function FoodCard({ item }: { item: FoodItem }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = item.stockAvailable === false;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem(item, 1, item.price);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article
      className={`card card-hover group relative flex flex-col overflow-hidden ${outOfStock ? 'opacity-60' : ''}`}
    >
      <Link href={`/food/${item.id}`} className="block flex-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-900">
          <RemoteImage
            src={resolveImageUrl(item.image, { w: IMAGE_WIDTH.card })}
            alt={item.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-110"
            sizes="(max-width:768px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {outOfStock ? (
            <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
              Out of stock
            </span>
          ) : (
            <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              ★ {item.rating?.toFixed(1) || '4.5'}
            </span>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="line-clamp-2 font-bold leading-tight transition group-hover:text-accent-dark">
            {item.name}
          </h3>
          <p className="mt-1 text-xs text-muted line-clamp-2">{item.description}</p>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border px-3.5 py-3">
        <span className="font-extrabold text-accent-dark">{formatPKR(item.price)}</span>
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={outOfStock}
          className={`flex h-9 min-w-9 items-center justify-center gap-1 rounded-xl px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            added
              ? 'bg-green-600 text-white'
              : 'bg-gradient-to-r from-accent to-accent-dark text-stone-900 shadow-sm hover:shadow-md hover:brightness-105'
          }`}
          aria-label={`Add ${item.name} to cart`}
        >
          {added ? (
            '✓'
          ) : (
            <>
              <span className="text-base leading-none">+</span>
              <span className="hidden sm:inline">Add</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
