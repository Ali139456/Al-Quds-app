import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useDelivery } from '@/contexts/DeliveryContext';
import { RAWALPINDI_CENTER, RAWALPINDI_AREAS } from '@/constants/rawalpindiAreas';
import { DELIVERY_ZONE_INFO } from '@/constants/location';
import DeliveryZoneBanner from '@/components/DeliveryZoneBanner';
import { Radius, Spacing } from '@/constants/Spacing';

const MAP_HEIGHT = 220;
const QUICK_AREAS = RAWALPINDI_AREAS.filter((a) => a.id !== 'other').slice(0, 8);

function buildOsmEmbedUrl(lat: number | null, lng: number | null): string {
  const centerLat = lat ?? RAWALPINDI_CENTER.latitude;
  const centerLng = lng ?? RAWALPINDI_CENTER.longitude;
  const delta = lat != null ? 0.009 : RAWALPINDI_CENTER.latitudeDelta / 2;
  const lngDelta = lat != null ? 0.009 : RAWALPINDI_CENTER.longitudeDelta / 2;
  const bbox = [
    centerLng - lngDelta,
    centerLat - delta,
    centerLng + lngDelta,
    centerLat + delta,
  ]
    .map((n) => n.toFixed(5))
    .join('%2C');
  const marker =
    lat != null && lng != null ? `&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}` : '';
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`;
}

export default function DeliveryLocationPicker() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    guestAddressLine,
    guestLat,
    guestLng,
    gettingLocation,
    searchingLocation,
    handleUseCurrentLocation,
    handleSearchLocation,
    setGuestAddressLine,
  } = useDelivery();

  const [searchText, setSearchText] = useState(guestAddressLine);

  useEffect(() => {
    setSearchText(guestAddressLine);
  }, [guestAddressLine]);

  const hasPin = guestLat != null && guestLng != null;
  const osmEmbedUrl = buildOsmEmbedUrl(guestLat, guestLng);
  const busy = gettingLocation || searchingLocation;

  const runSearch = () => {
    void handleSearchLocation(searchText);
  };

  return (
    <View style={styles.wrap}>
      <DeliveryZoneBanner compact />
      <Text style={[styles.zoneInfo, { color: colors.muted }]}>{DELIVERY_ZONE_INFO}</Text>
      <View style={[styles.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <FontAwesome name="search" size={14} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search area e.g. Saddar, Chaklala..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={(t) => {
            setSearchText(t);
            setGuestAddressLine(t);
          }}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        <Pressable
          style={[styles.searchBtn, { backgroundColor: colors.accent }]}
          onPress={runSearch}
          disabled={busy}
        >
          {searchingLocation ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome name="arrow-right" size={12} color="#fff" />
          )}
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAreas}>
        {QUICK_AREAS.map((area) => (
          <Pressable
            key={area.id}
            style={[styles.areaChip, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setSearchText(area.name);
              void handleSearchLocation(area.name);
            }}
          >
            <Text style={[styles.areaChipText, { color: colors.text }]}>{area.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {Platform.OS === 'web' ? (
        <View style={[styles.mapWrap, { borderColor: colors.border }]}>
          {/* @ts-expect-error web iframe */}
          <iframe
            key={osmEmbedUrl}
            src={osmEmbedUrl}
            style={{
              width: '100%',
              height: MAP_HEIGHT,
              border: 'none',
              borderRadius: Radius.lg,
              display: 'block',
            }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Delivery map"
          />
        </View>
      ) : (
        <View style={[styles.previewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <FontAwesome name="map-marker" size={24} color={colors.accent} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
              {guestAddressLine.trim() || 'Search or pick an area above'}
            </Text>
            <Text style={[styles.previewSub, { color: colors.muted }]}>
              {hasPin ? '✓ Delivery point set in Rawalpindi' : 'Tap a quick area chip or search'}
            </Text>
          </View>
        </View>
      )}

      <Pressable
        style={[styles.locationBtn, styles.locationBtnSecondary, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => void handleUseCurrentLocation()}
        disabled={busy}
      >
        {gettingLocation ? (
          <ActivityIndicator size="small" color={colors.muted} />
        ) : (
          <>
            <FontAwesome name="location-arrow" size={14} color={colors.muted} />
            <Text style={[styles.locationBtnText, { color: colors.muted }]}>Use where I am now (GPS)</Text>
          </>
        )}
      </Pressable>
      <Text style={[styles.gpsHint, { color: colors.muted }]}>
        GPS delivers to your current spot (e.g. office). To send food home, pick a saved address instead.
      </Text>

      {hasPin && guestAddressLine ? (
        <View style={[styles.addressBox, { backgroundColor: colors.accentMuted, borderColor: colors.accent + '44' }]}>
          <FontAwesome name="map-marker" size={14} color={colors.accent} />
          <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
            {guestAddressLine}
          </Text>
        </View>
      ) : (
        <Text style={[styles.waitingText, { color: colors.muted }]}>
          Search an area or pick a quick chip to set delivery point
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  zoneInfo: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: Spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingLeft: Spacing.sm,
    paddingRight: 4,
    minHeight: 44,
  },
  searchIcon: { marginRight: Spacing.xs },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Spacing.sm,
    minWidth: 0,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAreas: { gap: Spacing.xs, paddingVertical: 2 },
  areaChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  areaChipText: { fontSize: 11, fontWeight: '600' },
  mapWrap: {
    height: MAP_HEIGHT,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  previewCard: {
    minHeight: 88,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  previewTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  previewSub: { fontSize: 12, lineHeight: 16 },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  locationBtnSecondary: {
    marginTop: Spacing.xs,
  },
  locationBtnText: { fontSize: 13, fontWeight: '600' },
  gpsHint: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  addressText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  waitingText: { fontSize: 11, textAlign: 'center', paddingVertical: Spacing.xs },
});
