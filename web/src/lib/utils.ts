export function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

export function resolveImageUrl(image?: string | null): string {
  if (!image) return '/al-quds-icon.png';
  if (image.startsWith('http')) return image;
  const base = (process.env.NEXT_PUBLIC_API_URL || 'https://al-quds-app-production.up.railway.app').replace(/\/$/, '');
  return `${base}${image.startsWith('/') ? image : `/${image}`}`;
}

export const RAWALPINDI_BOUNDS = {
  latMin: 33.55,
  latMax: 33.68,
  lngMin: 72.92,
  lngMax: 73.18,
};

export function isInRawalpindi(lat: number, lng: number): boolean {
  return (
    lat >= RAWALPINDI_BOUNDS.latMin &&
    lat <= RAWALPINDI_BOUNDS.latMax &&
    lng >= RAWALPINDI_BOUNDS.lngMin &&
    lng <= RAWALPINDI_BOUNDS.lngMax
  );
}

export const RAWALPINDI_AREAS = [
  { id: 'saddar', name: 'Saddar', latitude: 33.601, longitude: 73.069 },
  { id: 'satellite-town', name: 'Satellite Town', latitude: 33.606, longitude: 73.071 },
  { id: 'raja-bazaar', name: 'Raja Bazaar', latitude: 33.598, longitude: 73.072 },
  { id: 'committee-chowk', name: 'Committee Chowk', latitude: 33.597, longitude: 73.065 },
  { id: 'commercial-market', name: 'Commercial Market', latitude: 33.602, longitude: 73.067 },
  { id: 'lalazar', name: 'Lalazar', latitude: 33.612, longitude: 73.058 },
  { id: 'peoples-colony', name: "People's Colony", latitude: 33.608, longitude: 73.078 },
  { id: 'askari-colony', name: 'Askari Colony', latitude: 33.615, longitude: 73.052 },
  { id: 'westridge', name: 'Westridge', latitude: 33.589, longitude: 73.048 },
  { id: 'rawalpindi-cantt', name: 'Rawalpindi Cantt', latitude: 33.578, longitude: 73.055 },
  { id: 'mall-road', name: 'Mall Road', latitude: 33.584, longitude: 73.058 },
  { id: 'chaklala', name: 'Chaklala', latitude: 33.615, longitude: 72.985 },
  { id: 'pirwadhai', name: 'Pirwadhai', latitude: 33.618, longitude: 73.088 },
  { id: 'bahria-town', name: 'Bahria Town', latitude: 33.558, longitude: 72.985 },
  { id: 'saddar-lines', name: 'Saddar Lines', latitude: 33.5767, longitude: 73.0524 },
] as const;

export function getAreaByName(name: string) {
  return RAWALPINDI_AREAS.find((a) => a.name.toLowerCase() === name.toLowerCase());
}

export const PAYMENT_ACCOUNT = {
  number: '03175858934',
  name: 'Muhammad Ali Shibli',
  label: 'Easypaisa / JazzCash',
};

export function normalizePakPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (/^03\d{9}$/.test(digits)) return digits;
  if (/^923\d{9}$/.test(digits)) return '0' + digits.slice(2);
  return null;
}

export function formatPakPhoneDisplay(phone: string): string {
  const n = normalizePakPhone(phone);
  if (!n) return phone;
  return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
}
