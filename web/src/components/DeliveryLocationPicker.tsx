'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  DELIVERY_ZONE_INFO,
  DELIVERY_ZONE_OUT_MESSAGE,
  geocodeAddress,
  reverseGeocode,
  type DeliveryPin,
} from '@/lib/geo';
import { isInRawalpindi, RAWALPINDI_AREAS } from '@/lib/utils';

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted md:h-[300px]">
      Loading map...
    </div>
  ),
});

const QUICK_AREAS = RAWALPINDI_AREAS.slice(0, 10);

type Props = {
  value: DeliveryPin | null;
  onChange: (pin: DeliveryPin | null) => void;
  onError?: (msg: string) => void;
};

export function DeliveryLocationPicker({ value, onChange, onError }: Props) {
  const [search, setSearch] = useState(value?.addressLine ?? '');
  const [searching, setSearching] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);

  const setError = (msg: string) => onError?.(msg);

  const applyPin = async (lat: number, lng: number, addressLine?: string) => {
    if (!isInRawalpindi(lat, lng)) {
      setError(DELIVERY_ZONE_OUT_MESSAGE);
      return;
    }
    let line = addressLine?.trim();
    if (!line) {
      const rev = await reverseGeocode(lat, lng);
      line = rev?.addressLine || 'Delivery location';
    }
    setSearch(line);
    onChange({ lat, lng, addressLine: line });
  };

  const runSearch = async () => {
    const q = search.trim();
    if (!q) {
      setError('Enter an area or street to search.');
      return;
    }
    setSearching(true);
    const result = await geocodeAddress(q);
    setSearching(false);
    if (!result) {
      setError('Location not found. Try Saddar, Chaklala, Commercial Market…');
      return;
    }
    await applyPin(result.lat, result.lng, result.addressLine);
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      setError('GPS not supported in this browser.');
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGettingGps(false);
        await applyPin(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGettingGps(false);
        setError('Could not get location. Allow GPS access in browser settings.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const pickArea = async (name: string) => {
    setSearch(name);
    setSearching(true);
    const result = await geocodeAddress(name);
    setSearching(false);
    if (result) await applyPin(result.lat, result.lng, result.addressLine);
    else setError('Could not find that area.');
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-center text-xs font-medium text-accent-dark">
        {DELIVERY_ZONE_INFO}
      </div>

      <div className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Search area e.g. Saddar, Chaklala…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runSearch())}
        />
        <button type="button" className="btn-primary shrink-0 !px-4" onClick={runSearch} disabled={searching}>
          {searching ? '…' : 'Go'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_AREAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => pickArea(a.name)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition hover:border-accent hover:bg-accent/10"
          >
            {a.name}
          </button>
        ))}
      </div>

      <DeliveryMap
        lat={value?.lat ?? null}
        lng={value?.lng ?? null}
        onPick={(lat, lng) => void applyPin(lat, lng)}
        onOutOfZone={() => setError(DELIVERY_ZONE_OUT_MESSAGE)}
      />

      <button
        type="button"
        className="btn-secondary w-full !py-2.5 text-sm"
        onClick={useGps}
        disabled={gettingGps}
      >
        {gettingGps ? 'Getting location…' : '📍 Use my current location (GPS)'}
      </button>

      {value ? (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2.5">
          <span className="text-accent-dark">📍</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-accent-dark">Delivery pin set</p>
            <p className="text-sm font-medium">{value.addressLine}</p>
            <p className="text-xs text-muted">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-muted">Search, tap the map, or use GPS to set your delivery point</p>
      )}
    </div>
  );
}
