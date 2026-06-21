/**
 * Delivery areas in Rawalpindi, Pakistan.
 * Optional lat/lng is approximate center for map display.
 */
export interface RawalpindiArea {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

export const RAWALPINDI_CENTER = {
  latitude: 33.6007,
  longitude: 73.0679,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
} as const;

export const RAWALPINDI_AREAS: RawalpindiArea[] = [
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
  { id: 'dhoke-syedan', name: 'Dhoke Syedan', latitude: 33.595, longitude: 73.082 },
  { id: 'urdu-bazar', name: 'Urdu Bazar', latitude: 33.599, longitude: 73.074 },
  { id: 'asghar-mall', name: 'Asghar Mall', latitude: 33.592, longitude: 73.078 },
  { id: 'bahria-town', name: 'Bahria Town', latitude: 33.558, longitude: 72.985 },
  { id: 'judicial-town', name: 'Judicial Town', latitude: 33.622, longitude: 73.062 },
  { id: 'raja-town', name: 'Raja Town', latitude: 33.61, longitude: 73.075 },
  { id: 'moti-mahel', name: 'Moti Mahel', latitude: 33.59, longitude: 73.068 },
  { id: 'liaquat-bagh', name: 'Liaquat Bagh', latitude: 33.604, longitude: 73.076 },
  { id: 'chaklala-scheme', name: 'Chaklala Scheme', latitude: 33.608, longitude: 72.992 },
  { id: 'kamran-chowk', name: 'Kamran Chowk', latitude: 33.6105, longitude: 73.0512 },
  { id: 'fazaia-colony', name: 'Fazaia Colony', latitude: 33.572, longitude: 73.042 },
  { id: 'industrial-area', name: 'Industrial Area', latitude: 33.635, longitude: 73.065 },
  { id: 'new-katarian', name: 'New Katarian', latitude: 33.625, longitude: 73.072 },
  { id: 'dhoke-chiraghdin', name: 'Dhoke Chiraghdin', latitude: 33.588, longitude: 73.075 },
  { id: 'other', name: 'Other (Rawalpindi)', latitude: 33.6007, longitude: 73.0679 },
];

export function getAreaByName(name: string): RawalpindiArea | undefined {
  const trimmed = name.trim();
  return RAWALPINDI_AREAS.find(
    (a) => a.name.toLowerCase() === trimmed.toLowerCase()
  );
}
