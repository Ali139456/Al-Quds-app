import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRider } from '@/contexts/RiderContext';

const BROADCAST_INTERVAL_MS = 8000;

async function sendLocation(riderId: string, lat: number, lng: number): Promise<void> {
  if (!API_BASE_URL) return;
  try {
    await fetch(`${API_BASE_URL}/api/rider/location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riderId, latitude: lat, longitude: lng }),
    });
  } catch (_) {}
}

async function getCurrentCoords(): Promise<{ lat: number; lng: number } | null> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: loc.coords.latitude, lng: loc.coords.longitude };
}

/** Sends rider GPS to backend while they have active deliveries. */
export function useRiderLocationBroadcast() {
  const { user } = useAuth();
  const { active } = useRider();
  const watchRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const shouldBroadcast = user?.role === 'rider' && active.length > 0;
    if (!shouldBroadcast || !user) {
      if (watchRef.current) {
        clearInterval(watchRef.current);
        watchRef.current = null;
      }
      return;
    }

    const broadcast = async () => {
      const coords = await getCurrentCoords();
      if (coords) await sendLocation(user.id, coords.lat, coords.lng);
    };

    broadcast();
    watchRef.current = setInterval(broadcast, BROADCAST_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') broadcast();
    });

    return () => {
      if (watchRef.current) clearInterval(watchRef.current);
      watchRef.current = null;
      sub.remove();
    };
  }, [user, active.length]);
}
