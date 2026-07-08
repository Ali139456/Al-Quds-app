import Image from 'next/image';
import Link from 'next/link';
import type { Deal } from '@/lib/types';
import { formatPKR, resolveImageUrl } from '@/lib/utils';

export function DealCard({ deal }: { deal: Deal }) {
  const savings = deal.originalPrice - deal.dealPrice;
  return (
    <Link href={`/deal/${deal.id}`} className="card group min-w-[260px] overflow-hidden transition hover:shadow-md md:min-w-0">
      <div className="relative aspect-[16/10] bg-stone-100">
        <Image src={resolveImageUrl(deal.image)} alt={deal.title} fill className="object-cover" sizes="280px" />
        {deal.badge && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-[10px] font-extrabold text-stone-900">
            {deal.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-extrabold">{deal.title}</h3>
        {deal.subtitle && <p className="mt-1 text-sm text-muted">{deal.subtitle}</p>}
        <div className="mt-3 flex items-end gap-2">
          <span className="text-lg font-extrabold text-accent-dark">{formatPKR(deal.dealPrice)}</span>
          <span className="text-sm text-muted line-through">{formatPKR(deal.originalPrice)}</span>
        </div>
        {savings > 0 && <p className="mt-1 text-xs font-bold text-green-600">Save {formatPKR(savings)}</p>}
      </div>
    </Link>
  );
}
