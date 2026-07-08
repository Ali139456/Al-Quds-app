import Image from 'next/image';
import Link from 'next/link';
import type { FoodItem } from '@/lib/types';
import { formatPKR, resolveImageUrl } from '@/lib/utils';

export function FoodCard({ item }: { item: FoodItem }) {
  const outOfStock = item.stockAvailable === false;
  return (
    <Link
      href={`/food/${item.id}`}
      className={`card group overflow-hidden transition hover:shadow-md ${outOfStock ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-[4/3] bg-stone-100">
        <Image
          src={resolveImageUrl(item.image)}
          alt={item.name}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width:768px) 50vw, 25vw"
        />
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 font-bold leading-tight">{item.name}</h3>
        <p className="mt-1 text-xs text-muted line-clamp-2">{item.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-extrabold text-accent-dark">{formatPKR(item.price)}</span>
          <span className="text-xs text-muted">★ {item.rating?.toFixed(1) || '4.5'}</span>
        </div>
      </div>
    </Link>
  );
}
