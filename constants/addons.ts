import type { Addon, FoodItem } from '@/types';

export const DEFAULT_ADDONS: Addon[] = [
  { id: 'addon_fries', name: 'Fries', price: 80, image: '/uploads/menu/addons/addon_fries.jpg' },
  { id: 'addon_pepsi', name: 'Pepsi', price: 80, image: '/uploads/menu/addons/addon_pepsi.jpg' },
  { id: 'addon_coca_cola', name: 'Coca Cola', price: 80, image: '/uploads/menu/addons/addon_coca_cola.jpg' },
  { id: 'addon_fanta', name: 'Fanta', price: 80, image: '/uploads/menu/addons/addon_fanta.jpg' },
  { id: 'addon_sprite', name: 'Sprite', price: 80, image: '/uploads/menu/addons/addon_sprite.jpg' },
  { id: 'addon_7up', name: '7Up', price: 80, image: '/uploads/menu/addons/addon_7up.jpg' },
  { id: 'addon_mirinda', name: 'Mirinda', price: 80, image: '/uploads/menu/addons/addon_mirinda.jpg' },
];

export function isFriesAddon(addon: Addon): boolean {
  return /fries/i.test(addon.name) || addon.id.includes('fries');
}

export function addonsToMenuItems(addons: Addon[]): FoodItem[] {
  return addons.map((addon) => {
    const fries = isFriesAddon(addon);
    return {
      id: addon.id,
      name: addon.name,
      description: fries
        ? 'Crispy golden fries — perfect as a side'
        : 'Chilled refreshing soft drink',
      price: addon.price,
      category: fries ? 'fries' : 'drinks',
      image: addon.image || (fries ? '🍟' : '🥤'),
      rating: 4.6,
      prepTime: 5,
    };
  });
}

export function groupAddons(addons?: Addon[] | null): { fries: Addon[]; drinks: Addon[] } {
  const fries: Addon[] = [];
  const drinks: Addon[] = [];
  for (const addon of addons ?? []) {
    if (isFriesAddon(addon)) fries.push(addon);
    else drinks.push(addon);
  }
  return { fries, drinks };
}
