import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, type MapPressEvent, type Region } from 'react-native-maps';
import { RAWALPINDI_CENTER } from '@/constants/rawalpindiAreas';
import type { AddressMapViewProps } from './AddressMapView.types';

export default function AddressMapView({
  lat,
  lng,
  onPress,
  mapRef,
  style,
  height = 220,
  markerTitle = 'Your location',
}: AddressMapViewProps) {
  const internalRef = useRef<MapView>(null);
  const ref = mapRef ?? internalRef;

  useEffect(() => {
    if (ref.current && lat != null && lng != null) {
      ref.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });
    }
  }, [lat, lng, ref]);

  const initialRegion: Region =
    lat != null && lng != null
      ? { latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }
      : RAWALPINDI_CENTER;

  return (
    <MapView
      ref={ref}
      style={[styles.map, { height }, style]}
      initialRegion={initialRegion}
      onPress={(e: MapPressEvent) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        onPress?.(latitude, longitude);
      }}
    >
      {lat != null && lng != null ? (
        <Marker coordinate={{ latitude: lat, longitude: lng }} title={markerTitle} />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%' },
});
