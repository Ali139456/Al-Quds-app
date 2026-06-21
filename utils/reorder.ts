import type { CartItem, FoodItem, PastOrder, PastOrderItem } from '@/types';

export function buildReorderItems(
  orderItems: PastOrderItem[],
  getFoodById: (id: string) => FoodItem | undefined
): { food: FoodItem; quantity: number; variety?: string; addons?: { id: string; name: string; price: number }[] }[] {
  const result: { food: FoodItem; quantity: number; variety?: string; addons?: { id: string; name: string; price: number }[] }[] = [];
  for (const oi of orderItems) {
    const food = getFoodById(oi.foodId);
    if (!food) continue;
    const addons = oi.addons
      ? oi.addons.split(', ').map((name) => {
          const match = food.addons?.find((a) => a.name === name);
          return match || { id: `addon_${name}`, name, price: 0 };
        })
      : undefined;
    result.push({ food, quantity: oi.quantity, variety: oi.variety, addons });
  }
  return result;
}

export function orderToCartLines(order: PastOrder, getFoodById: (id: string) => FoodItem | undefined) {
  return buildReorderItems(order.items, getFoodById);
}
