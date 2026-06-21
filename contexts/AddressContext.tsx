import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { SavedAddress } from '@/types';
import { getStoredAddresses, setStoredAddresses, getSelectedAddressId, setSelectedAddressId } from '@/utils/storage';
import { isInRawalpindi, DEFAULT_CITY } from '@/constants/location';
import { useAuth } from '@/contexts/AuthContext';

type AddressContextType = {
  addresses: SavedAddress[];
  selectedAddress: SavedAddress | null;
  isLoading: boolean;
  addAddress: (address: Omit<SavedAddress, 'id' | 'userId'>) => Promise<{ ok: boolean; error?: string }>;
  removeAddress: (id: string) => Promise<void>;
  setSelectedAddress: (id: string | null) => Promise<void>;
  getCurrentLocation: () => Promise<{ lat: number; lng: number } | null>;
  isInRawalpindi: (lat: number, lng: number) => boolean;
};

const AddressContext = createContext<AddressContextType | null>(null);

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddressState] = useState<SavedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const list = await getStoredAddresses();
    const selectedId = await getSelectedAddressId();
    setAddresses(list);
    setSelectedAddressState(list.find((a) => a.id === selectedId) || list[0] || null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);


  const addAddress = useCallback(
    async (address: Omit<SavedAddress, 'id' | 'userId'>) => {
      if (!user) return { ok: false, error: 'Please login to save addresses' };
      if (!isInRawalpindi(address.latitude, address.longitude)) {
        return { ok: false, error: "Sorry, we don't deliver to this location. Please choose an address within Rawalpindi, Pakistan." };
      }
      const newAddr: SavedAddress = {
        ...address,
        id: `addr_${Date.now()}`,
        userId: user.id,
        city: address.city || DEFAULT_CITY,
      };
      const list = await getStoredAddresses();
      const updated = [...list, newAddr];
      await setStoredAddresses(updated);
      setAddresses(updated);
      await setSelectedAddressId(newAddr.id);
      setSelectedAddressState(newAddr);
      return { ok: true };
    },
    [user]
  );

  const removeAddress = useCallback(async (id: string) => {
    const list = await getStoredAddresses();
    const updated = list.filter((a) => a.id !== id);
    await setStoredAddresses(updated);
    setAddresses(updated);
    if (selectedAddress?.id === id) {
      await setSelectedAddressId(updated[0]?.id || null);
      setSelectedAddressState(updated[0] || null);
    } else {
      setSelectedAddressState(updated.find((a) => a.id === selectedAddress?.id) || updated[0] || null);
    }
  }, [selectedAddress]);

  const setSelectedAddress = useCallback(async (id: string | null) => {
    await setSelectedAddressId(id);
    const list = await getStoredAddresses();
    setSelectedAddressState(id ? list.find((a) => a.id === id) || null : null);
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
      });
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  }, []);

  return (
    <AddressContext.Provider
      value={{
        addresses: user ? addresses.filter((a) => a.userId === user.id) : [],
        selectedAddress: user && selectedAddress && selectedAddress.userId === user.id ? selectedAddress : null,
        isLoading,
        addAddress,
        removeAddress,
        setSelectedAddress,
        getCurrentLocation,
        isInRawalpindi,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddress must be used within AddressProvider');
  return ctx;
}
