'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FoodCard } from '@/components/FoodCard';
import { DealCard } from '@/components/DealCard';
import { apiFetch } from '@/lib/api';
import type { FoodItem, Deal, Category } from '@/lib/types';

export default function MenuPageClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialTab = searchParams.get('tab') || 'menu';

  const [menu, setMenu] = useState<FoodItem[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState(initialCategory);
  const [tab, setTab] = useState<'menu' | 'deals'>(initialTab === 'deals' ? 'deals' : 'menu');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<FoodItem[]>('/api/menu'),
      apiFetch<Deal[]>('/api/deals'),
      apiFetch<Category[]>('/api/categories'),
    ])
      .then(([m, d, c]) => {
        setMenu(m);
        setDeals(d);
        setCategories(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let items = menu;
    if (category !== 'all') items = items.filter((i) => i.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [menu, category, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Menu</h1>
      <p className="mt-1 text-muted">Browse our full Al-Quds menu</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('menu')}
          className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'menu' ? 'bg-accent text-stone-900' : 'border border-border bg-card'}`}
        >
          All items
        </button>
        <button
          type="button"
          onClick={() => setTab('deals')}
          className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'deals' ? 'bg-accent text-stone-900' : 'border border-border bg-card'}`}
        >
          Deals
        </button>
      </div>

      {tab === 'menu' && (
        <>
          <input
            className="input-field mt-4"
            placeholder="Search burgers, pasta, fried..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${category === 'all' ? 'bg-stone-900 text-white' : 'border border-border bg-card'}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${category === c.id ? 'bg-stone-900 text-white' : 'border border-border bg-card'}`}
              >
                {c.label || c.name}
              </button>
            ))}
          </div>
          {loading ? (
            <p className="mt-8 text-muted">Loading menu...</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => (
                <FoodCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'deals' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      )}
    </div>
  );
}
