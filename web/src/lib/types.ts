export type Variety = { name: string; priceModifier: number };
export type Addon = { id: string; name: string; price: number; image?: string };

export type FoodItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  prepTime: number;
  varieties?: Variety[];
  addons?: Addon[];
  stockAvailable?: boolean;
  stockMaxQty?: number;
  stockReason?: string | null;
};

export type CartItem = {
  food: FoodItem;
  quantity: number;
  unitPrice: number;
  variety?: string;
  addons?: Addon[];
  lineKey: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role?: 'customer' | 'rider';
};

export type Banner = {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  sortOrder?: number;
};

export type Deal = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  dealPrice: number;
  originalPrice: number;
  menuItemIds?: string[];
  badge?: string;
  items?: FoodItem[];
  stockAvailable?: boolean;
  stockMaxQty?: number;
};

export type Category = {
  id: string;
  label: string;
  name: string;
  icon?: string;
  image?: string;
  sortOrder?: number;
  active?: boolean;
};

export type AppSettings = {
  freeDeliveryMin: number;
  defaultDeliveryFee: number;
  storeOpen: boolean;
  busyMode: boolean;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  supportWhatsapp?: string;
  supportPhone?: string;
};

export type CouponResult = {
  valid: boolean;
  code?: string;
  couponId?: string;
  discount?: number;
  freeDelivery?: boolean;
  description?: string;
  error?: string;
};

export type SavedAddress = {
  id: string;
  label: string;
  area: string;
  houseStreet: string;
  instructions?: string;
  latitude: number;
  longitude: number;
  userId: string;
};

export type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export type PastOrder = {
  id: string;
  userId: string;
  items: { foodId: string; name: string; price: number; quantity: number; variety?: string; addons?: string; image?: string }[];
  total: number;
  addressLabel: string;
  addressLine: string;
  status: OrderStatus;
  createdAt: string;
  paymentMethod?: string;
};
