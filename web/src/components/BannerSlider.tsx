'use client';

import { useEffect, useState } from 'react';
import { RemoteImage } from '@/components/RemoteImage';
import { apiFetch } from '@/lib/api';
import type { Banner } from '@/lib/types';
import { IMAGE_WIDTH, resolveImageUrl } from '@/lib/utils';

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    apiFetch<Banner[]>('/api/banners').then(setBanners).catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + banners.length) % banners.length);
  };

  if (!banners.length) {
    return (
      <div className="card flex aspect-[21/8] min-h-[180px] items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white md:min-h-[240px]">
        <div className="text-center">
          <p className="text-2xl font-extrabold text-accent md:text-3xl">Al-Quds</p>
          <p className="mt-2 text-sm text-stone-300">Fried · Burgers · Arabian · Chinese · Pasta</p>
        </div>
      </div>
    );
  }

  const b = banners[index];

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border shadow-lg shadow-black/10">
      <div className="relative flex aspect-[21/8] min-h-[180px] w-full items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 md:min-h-[260px]">
        <RemoteImage
          key={b.id ?? index}
          src={resolveImageUrl(b.image, { w: IMAGE_WIDTH.banner })}
          alt={b.title}
          fill
          className="banner-slide object-contain p-1 md:p-2"
          priority
          sizes="(max-width: 768px) 100vw, 1152px"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
          <h2 className="text-lg font-extrabold text-white drop-shadow-md md:text-2xl">{b.title}</h2>
          {b.subtitle && (
            <p className="mt-1 max-w-xl text-sm text-stone-200 drop-shadow md:text-base">{b.subtitle}</p>
          )}
        </div>

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur transition hover:bg-black/60 group-hover:opacity-100"
              aria-label="Previous banner"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur transition hover:bg-black/60 group-hover:opacity-100"
              aria-label="Next banner"
            >
              ›
            </button>
            <div className="absolute bottom-4 right-4 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? 'w-6 bg-accent' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Banner ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
