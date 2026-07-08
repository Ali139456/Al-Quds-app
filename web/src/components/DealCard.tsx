import Link from 'next/link';
import { RemoteImage } from '@/components/RemoteImage';
import type { Deal } from '@/lib/types';
import { formatPKR, IMAGE_WIDTH, resolveImageUrl } from '@/lib/utils';

export function DealCard({ deal }: { deal: Deal }) {
  const savings = deal.originalPrice - deal.dealPrice;
  return (
    <Link href={`/deal/${deal.id}`} className="card card-hover group min-w-[260px] overflow-hidden md:min-w-0">
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-stone-900">
        <RemoteImage src={resolveImageUrl(deal.image, { w: IMAGE_WIDTH.deal })} alt={deal.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="280px" />
        {deal.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-[10px] font-extrabold text-stone-900 shadow-md">
            {deal.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-extrabold">{deal.title}</h3>
        {deal.subtitle && <p className="mt-1 text-sm text-muted">{deal.subtitle}</p>}
        <div className="mt-3 flex items-end gap-2 border-t border-border pt-3">
          <span className="text-lg font-extrabold text-accent-dark">{formatPKR(deal.dealPrice)}</span>
          <span className="text-sm text-muted line-through">{formatPKR(deal.originalPrice)}</span>
        </div>
        {savings > 0 && <p className="mt-1 text-xs font-bold text-green-600">Save {formatPKR(savings)}</p>}
      </div>
    </Link>
  );
}
