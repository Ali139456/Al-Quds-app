import { getAreaByName, isInRawalpindi, RAWALPINDI_AREAS } from '@/lib/utils';

export const RAWALPINDI_CENTER = { lat: 33.6007, lng: 73.0679 };

export const DELIVERY_ZONE_INFO = 'We deliver within Rawalpindi only. Tap the map or search your area.';

export const DELIVERY_ZONE_OUT_MESSAGE =
  "Sorry, we don't deliver to this location. Please choose a point within Rawalpindi.";

export type GeocodedAddress = {
  formattedAddress: string;
  addressLine: string;
  lat: number;
  lng: number;
};

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

async function fetchGoogleGeocode(params: string): Promise<GeocodedAddress | null> {
  if (!GOOGLE_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params}&key=${GOOGLE_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return null;
    const result = data.results[0];
    const { lat, lng } = result.geometry.location;
    const components = result.address_components as { long_name: string; types: string[] }[];
    const street = components.find((c) => c.types.includes('route'))?.long_name;
    const area = components.find((c) => c.types.includes('sublocality') || c.types.includes('neighborhood'))?.long_name;
    const addressLine = [street, area].filter(Boolean).join(', ') || result.formatted_address;
    return { formattedAddress: result.formatted_address, addressLine, lat, lng };
  } catch {
    return null;
  }
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
  if (!match) return null;
  return {
    formattedAddress: `${match.name}, Rawalpindi`,
    addressLine: match.name,
    lat: match.latitude,
    lng: match.longitude,
  };
}

async function geocodeNominatim(query: string): Promise<GeocodedAddress | null> {
  try {
    const search = query.toLowerCase().includes('rawalpindi') ? query : `${query}, Rawalpindi, Pakistan`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=5&countrycodes=pk`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'AlQudsWeb/1.0' },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { display_name?: string; lat?: string; lon?: string; name?: string }[];
    for (const row of rows) {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInRawalpindi(lat, lng)) continue;
      const addressLine = row.name || row.display_name?.split(',').slice(0, 2).join(', ') || query;
      return {
        formattedAddress: row.display_name ?? addressLine,
        addressLine,
        lat,
        lng,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function geocodeAddress(query: string): Promise<GeocodedAddress | null> {
  const q = query.trim();
  if (!q) return null;

  const local = geocodeFromLocalAreas(q);
  if (local && isInRawalpindi(local.lat, local.lng)) return local;

  const search = q.toLowerCase().includes('rawalpindi') ? q : `${q}, Rawalpindi, Pakistan`;
  const google = await fetchGoogleGeocode(`address=${encodeURIComponent(search)}`);
  if (google && isInRawalpindi(google.lat, google.lng)) return google;

  return geocodeNominatim(search);
}

async function reverseNominatim(lat: number, lng: number): Promise<GeocodedAddress | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'AlQudsWeb/1.0' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      display_name?: string;
      address?: { road?: string; suburb?: string; neighbourhood?: string };
    };
    const a = data.address ?? {};
    const addressLine = [a.road, a.suburb || a.neighbourhood].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(', ') || 'Selected location';
    return { formattedAddress: data.display_name ?? addressLine, addressLine, lat, lng };
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null> {
  const google = await fetchGoogleGeocode(`latlng=${lat},${lng}`);
  if (google) return google;
  return reverseNominatim(lat, lng);
}

export function buildOsmEmbedUrl(lat: number | null, lng: number | null): string {
  const centerLat = lat ?? RAWALPINDI_CENTER.lat;
  const centerLng = lng ?? RAWALPINDI_CENTER.lng;
  const delta = lat != null ? 0.009 : 0.04;
  const bbox = [centerLng - delta, centerLat - delta, centerLng + delta, centerLat + delta]
    .map((n) => n.toFixed(5))
    .join('%2C');
  const marker = lat != null && lng != null ? `&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}` : '';
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`;
}

export type DeliveryPin = {
  lat: number;
  lng: number;
  addressLine: string;
};
