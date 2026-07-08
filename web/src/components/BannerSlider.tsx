'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import type { Banner } from '@/lib/types';
import { resolveImageUrl } from '@/lib/utils';

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    apiFetch<Banner[]>('/api/banners').then(setBanners).catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) {
    return (
      <div className="card flex h-48 items-center justify-center bg-gradient-to-r from-stone-900 to-stone-700 text-white md:h-64">
        <div className="text-center">
          <p className="text-2xl font-extrabold text-accent">Al-Quds</p>
          <p className="mt-1 text-sm text-stone-300">Fried · Burgers · Arabian · Chinese · Pasta</p>
        </div>
      </div>
    );
  }

  const b = banners[index];
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="relative h-48 md:h-64">
        <Image src={resolveImageUrl(b.image)} alt={b.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h2 className="text-xl font-extrabold md:text-2xl">{b.title}</h2>
          {b.subtitle && <p className="mt-1 text-sm text-stone-200">{b.subtitle}</p>}
        </div>
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full ${i === index ? 'bg-accent' : 'bg-white/50'}`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
