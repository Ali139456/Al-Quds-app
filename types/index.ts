/** Menu category id from admin (e.g. burgers, pizza). Use 'all' only for filters. */
export type Category = string;

/** Size/variety option: name (e.g. Regular, Large) and price modifier in PKR (added to base price). */
export interface Variety {
  name: string;
  priceModifier: number;
}

/** Add-on (e.g. Fries, Cold Drink) with its own price. */
export interface Addon {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number; // base price in PKR
  category: Category;
  image: string;
  rating: number;
  prepTime: number; // minutes
  varieties?: Variety[];
  addons?: Addon[];
  /** From inventory recipes — false when ingredients insufficient. */
  stockAvailable?: boolean;
  stockMaxQty?: number;
  stockReason?: string | null;
}

export interface CartItem {
  food: FoodItem;
  quantity: number;
  /** Unit price for this line (base + variety modifier + addons). */
  unitPrice: number;
  /** Selected variety name, if any. */
  variety?: string;
  /** Price modifier for selected variety (0 if none). */
  varietyPriceModifier?: number;
  /** Selected add-ons. */
  addons?: Addon[];
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
}

export type UserRole = 'customer' | 'rider';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  role?: UserRole;
}

export interface RiderOrderItem {
  food_id: string;
  name: string;
  price: number;
  quantity: number;
  variety?: string;
  addons?: string;
}

export interface RiderOrder {
  id: string;
  user_id: string;
  total: number;
  subtotal?: number;
  address_label: string;
  address_line: string;
  latitude?: number;
  longitude?: number;
  customer_name?: string;
  customer_phone?: string;
  status: OrderStatus | 'cancelled';
  rider_id?: string;
  payment_method?: string;
  special_instructions?: string;
  created_at: string;
  items: RiderOrderItem[];
}

export interface SavedAddress {
  id: string;
  label: string;
  area?: string;
  addressLine: string;
  streetNumber?: string;
  instructions?: string;
  city: string;
  latitude: number;
  longitude: number;
  userId: string;
}

export interface PastOrderItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  variety?: string;
  addons?: string;
  addonIds?: string[];
  image?: string;
}

export type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';

export interface PastOrder {
  id: string;
  userId: string;
  items: PastOrderItem[];
  total: number;
  subtotal?: number;
  addressLabel: string;
  addressLine: string;
  status: OrderStatus;
  createdAt: string;
  paymentMethod?: string;
  couponCode?: string;
  discountAmount?: number;
  deliveryFee?: number;
  scheduledAt?: string;
  contactless?: boolean;
  specialInstructions?: string;
  paymentProofUrl?: string;
  tipAmount?: number;
  rating?: number;
  ratingComment?: string;
  loyaltyPointsEarned?: number;
}

export interface CouponResult {
  valid: boolean;
  code?: string;
  couponId?: string;
  discount?: number;
  freeDelivery?: boolean;
  description?: string;
  error?: string;
}

export interface AppSettings {
  freeDeliveryMin: number;
  defaultDeliveryFee: number;
  storeOpen: boolean;
  busyMode: boolean;
  busyExtraMins: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  loyaltyPointsPer100: number;
  referralBonus: number;
  proMonthlyFee: number;
  partialAdvancePercent: number;
  supportWhatsapp: string;
  supportPhone: string;
  deliveryZones: { id: string; name: string; deliveryFee: number; etaMin: number; etaMax: number }[];
  promotions: { id: string; title: string; type: string; value: number; minOrder: number; description: string }[];
}

export interface LoyaltyInfo {
  points: number;
  lifetimePoints: number;
  isPro: boolean;
  proUntil?: string;
  referralCode: string;
  walletBalance: number;
}

export interface AppNotification {
  id: number;
  title: string;
  body?: string;
  read: number;
  created_at: string;
}

export interface Deal {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  dealPrice: number;
  originalPrice: number;
  menuItemIds: string[];
  badge?: string;
  sortOrder: number;
  items?: FoodItem[];
  stockAvailable?: boolean;
  stockMaxQty?: number;
  stockReason?: string | null;
}
