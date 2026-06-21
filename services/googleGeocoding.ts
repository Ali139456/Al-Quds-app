import * as Location from 'expo-location';
import { DEFAULT_CITY, isInRawalpindi } from '@/constants/location';
import { getAreaByName, RAWALPINDI_AREAS } from '@/constants/rawalpindiAreas';

const API_KEY =
  typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '' : '';

export type GeocodedAddress = {
  formattedAddress: string;
  addressLine: string;
  city: string;
  lat: number;
  lng: number;
};

type GoogleGeocodeResult = {
  results?: {
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
    address_components: { long_name: string; short_name: string; types: string[] }[];
  }[];
  status: string;
};

function pickAddressLine(components: GoogleGeocodeResult['results'][0]['address_components']): string {
  const street = components.find((c) => c.types.includes('route'))?.long_name;
  const sublocality =
    components.find((c) => c.types.includes('sublocality') || c.types.includes('sublocality_level_1'))
      ?.long_name;
  const neighborhood = components.find((c) => c.types.includes('neighborhood'))?.long_name;
  const parts = [street, sublocality || neighborhood].filter(Boolean);
  return parts.join(', ') || '';
}

function pickCity(components: GoogleGeocodeResult['results'][0]['address_components']): string {
  return (
    components.find((c) => c.types.includes('locality'))?.long_name ||
    components.find((c) => c.types.includes('administrative_area_level_2'))?.long_name ||
    DEFAULT_CITY
  );
}

async function fetchGeocode(params: string): Promise<GeocodedAddress | null> {
  if (!API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = (await res.json()) as GoogleGeocodeResult;
    if (data.status !== 'OK' || !data.results?.length) return null;
    const result = data.results[0];
    const { lat, lng } = result.geometry.location;
    const addressLine = pickAddressLine(result.address_components) || result.formatted_address;
    return {
      formattedAddress: result.formatted_address,
      addressLine,
      city: pickCity(result.address_components),
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

/** Free reverse geocode via OpenStreetMap Nominatim (no API key). */
async function reverseGeocodeNominatim(lat: number, lng: number): Promise<GeocodedAddress | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'AlQudsFoodOrderApp/1.0' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      display_name?: string;
      address?: {
        road?: string;
        suburb?: string;
        neighbourhood?: string;
        city?: string;
        town?: string;
      };
    };
    const a = data.address ?? {};
    const parts = [a.road, a.suburb || a.neighbourhood].filter(Boolean);
    const addressLine = parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(', ') || '';
    if (!addressLine) return null;
    return {
      formattedAddress: data.display_name ?? addressLine,
      addressLine,
      city: a.city || a.town || DEFAULT_CITY,
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

async function reverseGeocodeExpo(lat: number, lng: number): Promise<GeocodedAddress | null> {
  try {
    const [rev] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!rev) return null;
    const parts = [rev.streetNumber, rev.street, rev.district, rev.subregion].filter(Boolean);
    const addressLine = parts.slice(0, 3).join(', ') || 'Current location';
    return {
      formattedAddress: addressLine,
      addressLine,
      city: rev.city || DEFAULT_CITY,
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

/** Reverse geocode coordinates — Google API, then OSM Nominatim, then expo-location */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null> {
  const google = await fetchGeocode(`latlng=${lat},${lng}`);
  if (google) return google;
  const osm = await reverseGeocodeNominatim(lat, lng);
  if (osm) return osm;
  return reverseGeocodeExpo(lat, lng);
}

function geocodeFromLocalAreas(query: string): GeocodedAddress | null {
  const exact = getAreaByName(query);
  const match =
    exact ??
    RAWALPINDI_AREAS.find((a) => {
      const n = a.name.toLowerCase();
      const q = query.trim().toLowerCase();
      return n.includes(q) || q.includes(n);
    });
  if (!match?.latitude || !match.longitude) return null;
  return {
    formattedAddress: `${match.name}, Rawalpindi`,
    addressLine: match.name,
    city: DEFAULT_CITY,
    lat: match.latitude,
    lng: match.longitude,
  };
}

/** Forward geocode via OpenStreetMap Nominatim (no API key). */
async function geocodeAddressNominatim(query: string): Promise<GeocodedAddress | null> {
  try {
    const search = query.toLowerCase().includes('rawalpindi') ? query : `${query}, Rawalpindi, Pakistan`;
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(search)}&format=json&limit=3&countrycodes=pk`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'AlQudsFoodOrderApp/1.0' },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as {
      display_name?: string;
      lat?: string;
      lon?: string;
      name?: string;
    }[];
    for (const row of rows) {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (!isInRawalpindi(lat, lng)) continue;
      const addressLine =
        row.name || row.display_name?.split(',').slice(0, 2).join(', ') || query.trim();
      return {
        formattedAddress: row.display_name ?? addressLine,
        addressLine,
        city: DEFAULT_CITY,
        lat,
        lng,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Forward geocode a street/area query within Rawalpindi */
export async function geocodeAddress(query: string): Promise<GeocodedAddress | null> {
  const q = query.trim();
  if (!q) return null;

  const local = geocodeFromLocalAreas(q);
  if (local && isInRawalpindi(local.lat, local.lng)) return local;

  const search = q.toLowerCase().includes('rawalpindi') ? q : `${q}, Rawalpindi, Pakistan`;
  const google = await fetchGeocode(`address=${encodeURIComponent(search)}`);
  if (google && isInRawalpindi(google.lat, google.lng)) return google;

  const osm = await geocodeAddressNominatim(search);
  if (osm) return osm;

  return null;
}

export function hasGoogleMapsApiKey(): boolean {
  return API_KEY.length > 0;
}
