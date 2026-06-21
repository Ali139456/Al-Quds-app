import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Linking, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing } from '@/constants/Spacing';
import { buildTrackingMapEmbedUrl, distanceKm, formatDistanceKm } from '@/utils/geo';
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
  const [MapView, setMapView] = useState<typeof import('react-native-maps')['default'] | null>(null);
  const [Marker, setMarker] = useState<typeof import('react-native-maps').Marker | null>(null);
  const mapRef = useRef<any>(null);

  const hasRider = riderLat != null && riderLng != null;
  const distance =
    hasRider ? formatDistanceKm(distanceKm(riderLat!, riderLng!, deliveryLat, deliveryLng)) : null;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('react-native-maps').then((m) => {
        setMapView(m.default);
        setMarker(m.Marker);
      });
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || Platform.OS === 'web') return;
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

  const embedUrl = buildTrackingMapEmbedUrl(
    { latitude: deliveryLat, longitude: deliveryLng },
    hasRider ? { latitude: riderLat!, longitude: riderLng! } : null
  );

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      {Platform.OS !== 'web' && MapView && Marker ? (
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
      ) : (
        <View style={[styles.webMap, { height }]}>
          {Platform.OS === 'web' ? (
            // @ts-expect-error web iframe
            <iframe
              key={embedUrl}
              title="Live tracking map"
              src={embedUrl}
              style={{
                border: 'none',
                width: '100%',
                height: '100%',
                borderRadius: Radius.md,
                display: 'block',
              }}
              loading="lazy"
            />
          ) : (
            <View style={[styles.webFallback, { backgroundColor: colors.card }]}>
              <Text style={{ color: colors.muted }}>Loading map…</Text>
            </View>
          )}
        </View>
      )}

      {showLegend ? (
        <View style={[styles.legend, { backgroundColor: colors.card }]}>
          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: '#D1AB66' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Delivery address</Text>
          </View>
          {hasRider ? (
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>
                Rider {distance ? `· ${distance}` : ''}
              </Text>
            </View>
          ) : (
            <Text style={[styles.waiting, { color: colors.muted }]}>Waiting for rider location…</Text>
          )}
          {riderUpdatedAt ? (
            <Text style={[styles.updated, { color: colors.muted }]}>
              Rider location updated {new Date(riderUpdatedAt.replace(' ', 'T') + 'Z').toLocaleTimeString()}
            </Text>
          ) : null}
          <Pressable style={styles.directionsBtn} onPress={openDirections}>
            <FontAwesome name="location-arrow" size={14} color={colors.accent} />
            <Text style={[styles.directionsText, { color: colors.accent }]}>Open directions</Text>
          </Pressable>
        </View>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  map: { width: '100%' },
  webMap: { width: '100%', overflow: 'hidden' },
  webFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  legend: { padding: Spacing.md, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, fontWeight: '600' },
  waiting: { fontSize: 12, fontStyle: 'italic' },
  updated: { fontSize: 11 },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  directionsText: { fontSize: 13, fontWeight: '700' },
});
