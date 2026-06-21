/** Haversine distance in kilometres between two coordinates. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/** Rough ETA in minutes from rider to delivery (city traffic ~20 km/h + buffer). */
export function estimateDeliveryMinutes(distanceKm: number, speedKmh = 20, bufferMins = 4): number {
  const travelMins = (distanceKm / speedKmh) * 60;
  return Math.max(5, Math.min(50, Math.round(travelMins + bufferMins)));
}

type Coord = { latitude: number; longitude: number };

/** Bounding box that fits all given coordinates with padding. */
export function fitBounds(points: Coord[], padding = 0.004): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  if (!points.length) {
    return { latitude: 33.6007, longitude: 73.0679, latitudeDelta: 0.05, longitudeDelta: 0.05 };
  }
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;
  for (const p of points) {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  }
  const latDelta = Math.max(maxLat - minLat + padding * 2, 0.012);
  const lngDelta = Math.max(maxLng - minLng + padding * 2, 0.012);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

/** OpenStreetMap embed URL showing delivery + optional rider point. */
export function buildTrackingMapEmbedUrl(
  delivery: Coord,
  rider?: Coord | null
): string {
  const points = rider ? [delivery, rider] : [delivery];
  const bounds = fitBounds(points, 0.003);
  const bbox = [
    bounds.longitude - bounds.longitudeDelta / 2,
    bounds.latitude - bounds.latitudeDelta / 2,
    bounds.longitude + bounds.longitudeDelta / 2,
    bounds.latitude + bounds.latitudeDelta / 2,
  ]
    .map((n) => n.toFixed(5))
    .join('%2C');
  const marker = `&marker=${delivery.latitude.toFixed(6)}%2C${delivery.longitude.toFixed(6)}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`;
}
