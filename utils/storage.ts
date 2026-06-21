import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types';
import type { SavedAddress } from '@/types';
import type { PastOrder } from '@/types';

const KEYS = {
  USER: '@alquds_user',
  ADDRESSES: '@alquds_addresses',
  ORDERS: '@alquds_orders',
  SELECTED_ADDRESS_ID: '@alquds_selected_address',
  DELIVERY_SESSION: '@alquds_delivery_session',
};

export type StoredDeliverySession = {
  customerName: string;
  customerPhone: string;
  streetNumber: string;
  instructions: string;
  guestAddressLine: string;
  guestLat: number | null;
  guestLng: number | null;
  setupComplete: boolean;
};

export async function getDeliverySession(): Promise<StoredDeliverySession | null> {
  const s = await AsyncStorage.getItem(KEYS.DELIVERY_SESSION);
  return s ? JSON.parse(s) : null;
}

export async function setDeliverySession(session: StoredDeliverySession): Promise<void> {
  await AsyncStorage.setItem(KEYS.DELIVERY_SESSION, JSON.stringify(session));
}

export async function clearDeliverySession(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.DELIVERY_SESSION);
}

export async function getStoredUser(): Promise<User | null> {
  const s = await AsyncStorage.getItem(KEYS.USER);
  return s ? JSON.parse(s) : null;
}

export async function setStoredUser(user: User | null): Promise<void> {
  if (user) await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  else await AsyncStorage.removeItem(KEYS.USER);
}

export async function getStoredAddresses(): Promise<SavedAddress[]> {
  const s = await AsyncStorage.getItem(KEYS.ADDRESSES);
  return s ? JSON.parse(s) : [];
}

export async function setStoredAddresses(addresses: SavedAddress[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ADDRESSES, JSON.stringify(addresses));
}

export async function getStoredOrders(): Promise<PastOrder[]> {
  const s = await AsyncStorage.getItem(KEYS.ORDERS);
  return s ? JSON.parse(s) : [];
}

export async function setStoredOrders(orders: PastOrder[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
}

export async function getSelectedAddressId(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.SELECTED_ADDRESS_ID);
}

export async function setSelectedAddressId(id: string | null): Promise<void> {
  if (id) await AsyncStorage.setItem(KEYS.SELECTED_ADDRESS_ID, id);
  else await AsyncStorage.removeItem(KEYS.SELECTED_ADDRESS_ID);
}
