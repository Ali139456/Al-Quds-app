// Rawalpindi approximate bounds (for validation)
export const RAWALPINDI_BOUNDS = {
  latMin: 33.55,
  latMax: 33.68,
  lngMin: 72.92,
  lngMax: 73.18,
};

export const DEFAULT_CITY = 'Rawalpindi';

export const DELIVERY_ZONE_TITLE = 'Outside delivery area';

export const DELIVERY_ZONE_INFO =
  'We deliver within Rawalpindi only. Orders outside this area cannot be placed.';

export const DELIVERY_ZONE_OUT_MESSAGE =
  "Sorry, we don't deliver to this location. Please choose an address within Rawalpindi, Pakistan.";

export const DELIVERY_ZONE_REQUIRED_MESSAGE =
  'Set a delivery location inside Rawalpindi to continue with your order.';

export type DeliveryZoneStatus = 'in_zone' | 'out_of_zone' | 'not_set';

export function isInRawalpindi(lat: number, lng: number): boolean {
  return (
    lat >= RAWALPINDI_BOUNDS.latMin &&
    lat <= RAWALPINDI_BOUNDS.latMax &&
    lng >= RAWALPINDI_BOUNDS.lngMin &&
    lng <= RAWALPINDI_BOUNDS.lngMax
  );
}

export function isAddressInDeliveryZone(address: {
  latitude: number;
  longitude: number;
}): boolean {
  return isInRawalpindi(address.latitude, address.longitude);
}

export function getGoogleMapsUrl(lat: number, lng: number, label?: string): string {
  const dest = label ? `${lat},${lng}(${encodeURIComponent(label)})` : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

export function getGoogleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
