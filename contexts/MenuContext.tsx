import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Addon, FoodItem, Variety } from '@/types';
import { MENU_ITEMS, CATEGORIES as FALLBACK_CATEGORIES } from '@/constants/menu';
import { API_BASE_URL } from '@/constants/api';
import { DEFAULT_ADDONS, addonsToMenuItems } from '@/constants/addons';
import { prefetchFoodImages } from '@/utils/prefetchFoodImages';

/** Default size options for burgers when API doesn't provide varieties */
const DEFAULT_BURGER_VARIETIES: Variety[] = [
  { name: 'Regular', priceModifier: 0 },
  { name: 'Large', priceModifier: 150 },
  { name: 'XLarge', priceModifier: 250 },
];

type MenuContextType = {
  items: FoodItem[];
  categories: MenuCategory[];
  allAddons: Addon[];
  isLoading: boolean;
  getFoodById: (id: string) => FoodItem | undefined;
  refreshMenu: () => void;
};

const MenuContext = createContext<MenuContextType | null>(null);

function ensureDefaultVarieties(item: FoodItem): FoodItem {
  if (item.varieties && item.varieties.length > 0) return item;
  if (item.category === 'burgers') {
    return { ...item, varieties: DEFAULT_BURGER_VARIETIES };
  }
  return item;
}

function mapApiToFoodItem(r: {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  rating?: number;
  prepTime?: number;
  varieties?: { name: string; priceModifier?: number; price?: number }[];
  addons?: { id: string; name: string; price: number }[];
  stockAvailable?: boolean;
  stockMaxQty?: number;
  stockReason?: string | null;
}): FoodItem {
  const varieties = Array.isArray(r.varieties)
    ? r.varieties.map((v) => ({ name: v.name, priceModifier: v.priceModifier ?? v.price ?? 0 }))
    : [];
  const mapped: FoodItem = {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    price: r.price,
    category: r.category as FoodItem['category'],
    image: r.image ?? '🍔',
    rating: r.rating ?? 4.5,
    prepTime: r.prepTime ?? 15,
    varieties: varieties.length > 0 ? varieties : undefined,
    addons: Array.isArray(r.addons) && r.addons.length > 0 ? r.addons : undefined,
    stockAvailable: r.stockAvailable !== false,
    stockMaxQty: r.stockMaxQty,
    stockReason: r.stockReason ?? null,
  };
  return ensureDefaultVarieties(mapped);
}

const FALLBACK_MENU_CATEGORIES: MenuCategory[] = FALLBACK_CATEGORIES.filter((c) => c.id !== 'all').map(
  (c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    image: 'image' in c ? (c as { image?: string }).image : undefined,
  })
);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [baseItems, setBaseItems] = useState<FoodItem[]>(MENU_ITEMS);
  const [categories, setCategories] = useState<MenuCategory[]>(FALLBACK_MENU_CATEGORIES);
  const [allAddons, setAllAddons] = useState<Addon[]>(DEFAULT_ADDONS);
  const [isLoading, setIsLoading] = useState(!!API_BASE_URL);
  const setBaseItemsRef = useRef(setBaseItems);
  const setCategoriesRef = useRef(setCategories);
  const setAllAddonsRef = useRef(setAllAddons);
  setBaseItemsRef.current = setBaseItems;
  setCategoriesRef.current = setCategories;
  setAllAddonsRef.current = setAllAddons;

  const items = useMemo(
    () => [...baseItems, ...addonsToMenuItems(allAddons)],
    [baseItems, allAddons]
  );

  const refreshMenu = useCallback(() => {
    if (!API_BASE_URL) {
      setBaseItemsRef.current(MENU_ITEMS.map(ensureDefaultVarieties));
      setCategoriesRef.current(FALLBACK_MENU_CATEGORIES);
      setAllAddonsRef.current(DEFAULT_ADDONS);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    Promise.all([
      fetch(API_BASE_URL + '/api/menu').then((res) => res.json()),
      fetch(API_BASE_URL + '/api/categories').then((res) => res.json()),
      fetch(API_BASE_URL + '/api/addons').then((res) => res.json()),
    ])
      .then(([menuData, categoriesData, addonsData]) => {
        const prefetchImages: (string | undefined)[] = [];
        if (Array.isArray(menuData)) {
          const mapped = menuData.map(mapApiToFoodItem);
          setBaseItemsRef.current(mapped);
          prefetchImages.push(...mapped.map((i) => i.image));
        }
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          const mappedCategories = categoriesData.map((c: { id: string; label?: string; name?: string; icon?: string; image?: string }) => {
            const image =
              c.image && String(c.image).startsWith('/uploads/')
                ? c.image
                : `/uploads/menu/categories/${c.id}.jpg`;
            return {
              id: c.id,
              label: c.label || c.name || c.id,
              icon: c.icon || '🍽️',
              image,
            };
          });
          setCategoriesRef.current(mappedCategories);
          prefetchImages.push(...mappedCategories.map((c) => c.image));
        }
        if (Array.isArray(addonsData) && addonsData.length > 0) {
          setAllAddonsRef.current(
            addonsData.map((a: { id: string; name: string; price: number; image?: string }) => ({
              id: a.id,
              name: a.name,
              price: Number(a.price),
              image: a.image,
            }))
          );
        }
        prefetchFoodImages(prefetchImages);
      })
      .catch(() => {
        setBaseItemsRef.current(MENU_ITEMS.map(ensureDefaultVarieties));
        setCategoriesRef.current(FALLBACK_MENU_CATEGORIES);
        setAllAddonsRef.current(DEFAULT_ADDONS);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refreshMenu();
  }, [refreshMenu]);

  const getFoodById = (id: string) => items.find((i) => i.id === id);

  return (
    <MenuContext.Provider value={{ items, categories, allAddons, isLoading, getFoodById, refreshMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}
