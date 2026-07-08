'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { isInRawalpindi, RAWALPINDI_BOUNDS } from '@/lib/utils';
import { RAWALPINDI_CENTER } from '@/lib/geo';

const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

type DeliveryMapProps = {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
  onOutOfZone?: () => void;
};

export default function DeliveryMap({ lat, lng, onPick, onOutOfZone }: DeliveryMapProps) {
  const center: [number, number] = lat != null && lng != null ? [lat, lng] : [RAWALPINDI_CENTER.lat, RAWALPINDI_CENTER.lng];
  const zoom = lat != null ? 15 : 12;

  const handlePick = (pickLat: number, pickLng: number) => {
    if (!isInRawalpindi(pickLat, pickLng)) {
      onOutOfZone?.();
      return;
    }
    onPick(pickLat, pickLng);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-[260px] w-full cursor-crosshair md:h-[300px]"
        scrollWheelZoom
        maxBounds={[
          [RAWALPINDI_BOUNDS.latMin, RAWALPINDI_BOUNDS.lngMin],
          [RAWALPINDI_BOUNDS.latMax, RAWALPINDI_BOUNDS.lngMax],
        ]}
        maxBoundsViscosity={0.85}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={handlePick} />
        {lat != null && lng != null && (
          <>
            <Marker position={[lat, lng]} icon={pinIcon} />
            <MapRecenter lat={lat} lng={lng} />
          </>
        )}
      </MapContainer>
      <p className="bg-card px-3 py-2 text-center text-xs text-muted">Tap map to set delivery pin</p>
    </div>
  );
}
