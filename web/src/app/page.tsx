import Link from 'next/link';
import { BannerSlider } from '@/components/BannerSlider';
import { FoodCard } from '@/components/FoodCard';
import { DealCard } from '@/components/DealCard';
import { apiFetch } from '@/lib/api';
import type { FoodItem, Deal, Category } from '@/lib/types';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function HomePage() {
  const [menu, deals, categories] = await Promise.all([
    apiFetch<FoodItem[]>('/api/menu').catch(() => [] as FoodItem[]),
    apiFetch<Deal[]>('/api/deals').catch(() => [] as Deal[]),
    apiFetch<Category[]>('/api/categories').catch(() => [] as Category[]),
  ]);

  const hotItems = menu.slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <section>
        <p className="text-sm text-muted">{getGreeting()} 👋</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Hungry? Order from Al-Quds</h1>
        <p className="mt-2 text-muted">Rawalpindi delivery · No app download needed</p>
      </section>

      <BannerSlider />

      {deals.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">🔥 Deals & Combos</h2>
            <Link href="/menu?tab=deals" className="text-sm font-bold text-accent-dark hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deals.slice(0, 3).map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-extrabold">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/menu?category=${encodeURIComponent(c.id)}`}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:border-accent hover:bg-accent/10"
              >
                {c.icon} {c.label || c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Popular picks</h2>
          <Link href="/menu" className="text-sm font-bold text-accent-dark hover:underline">
            Full menu
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {hotItems.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
