import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@alquds_favorites';

type FavoritesContextType = {
  favorites: string[];
  toggleFavorite: (foodId: string) => Promise<void>;
  isFavorite: (foodId: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((s) => {
      if (s) setFavorites(JSON.parse(s));
    });
  }, []);

  const persist = useCallback(async (ids: string[]) => {
    setFavorites(ids);
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  }, []);

  const toggleFavorite = useCallback(
    async (foodId: string) => {
      const next = favorites.includes(foodId)
        ? favorites.filter((id) => id !== foodId)
        : [...favorites, foodId];
      await persist(next);
    },
    [favorites, persist]
  );

  const isFavorite = useCallback((foodId: string) => favorites.includes(foodId), [favorites]);

  const value = useMemo(
    () => ({ favorites, toggleFavorite, isFavorite }),
    [favorites, toggleFavorite, isFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
