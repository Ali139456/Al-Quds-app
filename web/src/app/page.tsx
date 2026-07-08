import Link from 'next/link';
import { BannerSlider } from '@/components/BannerSlider';
import { FoodCard } from '@/components/FoodCard';
import { DealCard } from '@/components/DealCard';
import { SectionHeading } from '@/components/SectionHeading';
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
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
      <section className="hero-panel animate-fade-in">
        <p className="text-xs font-semibold text-accent-dark md:text-sm">{getGreeting()} 👋</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
          Hungry? Order from{' '}
          <span className="bg-gradient-to-r from-accent-dark to-accent bg-clip-text text-transparent">
            Al-Quds
          </span>
        </h1>
        <p className="mt-1.5 max-w-lg text-sm text-muted">
          Rawalpindi delivery · Burgers, fried chicken & more
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/menu" className="btn-primary !px-4 !py-2 text-sm">
            Order now
          </Link>
          <Link href="/menu?tab=deals" className="btn-secondary !px-4 !py-2 text-sm">
            View deals
          </Link>
        </div>
      </section>

      <section className="animate-fade-in">
        <BannerSlider />
      </section>

      {deals.length > 0 && (
        <section>
          <SectionHeading title="🔥 Deals & Combos" href="/menu?tab=deals" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {deals.slice(0, 3).map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section>
          <SectionHeading title="Browse by category" />
          <div className="flex flex-wrap gap-2.5">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/menu?category=${encodeURIComponent(c.id)}`}
                className="group rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent/10 hover:shadow-md"
              >
                <span className="mr-1.5">{c.icon}</span>
                {c.label || c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeading title="Popular picks" href="/menu" linkLabel="Full menu" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {hotItems.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
