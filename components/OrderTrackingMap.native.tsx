import { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Linking, Pressable } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing } from '@/constants/Spacing';
import { distanceKm, formatDistanceKm } from '@/utils/geo';
import { getGoogleMapsUrl } from '@/constants/location';

type Props = {
  deliveryLat: number;
  deliveryLng: number;
  riderLat?: number | null;
  riderLng?: number | null;
  riderUpdatedAt?: string | null;
  height?: number;
  showLegend?: boolean;
};

export default function OrderTrackingMap({
  deliveryLat,
  deliveryLng,
  riderLat,
  riderLng,
  riderUpdatedAt,
  height = 220,
  showLegend = true,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const mapRef = useRef<MapView>(null);

  const hasRider = riderLat != null && riderLng != null;
  const distance =
    hasRider ? formatDistanceKm(distanceKm(riderLat!, riderLng!, deliveryLat, deliveryLng)) : null;

  useEffect(() => {
    if (!mapRef.current) return;
    const points = [{ latitude: deliveryLat, longitude: deliveryLng }];
    if (hasRider) points.push({ latitude: riderLat!, longitude: riderLng! });
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [deliveryLat, deliveryLng, riderLat, riderLng, hasRider]);

  const openDirections = () => {
    const url = hasRider
      ? `https://www.google.com/maps/dir/?api=1&origin=${riderLat},${riderLng}&destination=${deliveryLat},${deliveryLng}`
      : getGoogleMapsUrl(deliveryLat, deliveryLng, 'Delivery');
    Linking.openURL(url);
  };

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <MapView
        ref={mapRef}
        style={[styles.map, { height }]}
        initialRegion={{
          latitude: deliveryLat,
          longitude: deliveryLng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={{ latitude: deliveryLat, longitude: deliveryLng }} title="Delivery" pinColor="#D1AB66" />
        {hasRider ? (
          <Marker coordinate={{ latitude: riderLat!, longitude: riderLng! }} title="Rider" pinColor="#3b82f6" />
        ) : null}
      </MapView>

      {showLegend ? (
        <View style={[styles.legend, { backgroundColor: colors.card }]}>
          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: '#D1AB66' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Delivery</Text>
            {hasRider ? (
              <>
                <View style={[styles.dot, { backgroundColor: '#3b82f6', marginLeft: Spacing.md }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>Rider</Text>
              </>
            ) : null}
          </View>
          {distance ? (
            <Text style={[styles.distance, { color: colors.muted }]}>{distance} away</Text>
          ) : null}
          {riderUpdatedAt ? (
            <Text style={[styles.updated, { color: colors.muted }]}>
              Updated {new Date(riderUpdatedAt).toLocaleTimeString()}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Pressable style={[styles.directionsBtn, { backgroundColor: colors.accent }]} onPress={openDirections}>
        <FontAwesome name="location-arrow" size={14} color="#0a0a0a" />
        <Text style={styles.directionsText}>Open in Maps</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1 },
  map: { width: '100%' },
  legend: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, fontWeight: '600' },
  distance: { fontSize: 11 },
  updated: { fontSize: 10 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  directionsText: { color: '#0a0a0a', fontWeight: '700', fontSize: 13 },
});
