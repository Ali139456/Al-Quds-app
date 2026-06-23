import { router } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  View,
  Platform,
  Linking,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { reverseGeocode } from '@/services/googleGeocoding';
import * as LinkingExpo from 'expo-linking';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAddress } from '@/contexts/AddressContext';
import { toast } from '@/contexts/ToastContext';
import {
  DEFAULT_CITY,
  getGoogleMapsSearchUrl,
  isInRawalpindi,
  DELIVERY_ZONE_OUT_MESSAGE,
  DELIVERY_ZONE_TITLE,
  DELIVERY_ZONE_INFO,
} from '@/constants/location';
import {
  RAWALPINDI_AREAS,
  getAreaByName,
  type RawalpindiArea,
} from '@/constants/rawalpindiAreas';
import AreaDropdown from '@/components/AreaDropdown';
import { useDelivery } from '@/contexts/DeliveryContext';

function coordsFromArea(areaName: string, selectedArea: RawalpindiArea | null) {
  const area = selectedArea ?? getAreaByName(areaName);
  if (area?.latitude == null || area?.longitude == null) return null;
  return { lat: area.latitude, lng: area.longitude };
}

export default function AddAddressScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addAddress, getCurrentLocation, isInRawalpindi: checkRawalpindi } =
    useAddress();
  const { applySavedAddress } = useDelivery();
  const [label, setLabel] = useState('');
  const [areaName, setAreaName] = useState('');
  const [selectedArea, setSelectedArea] = useState<RawalpindiArea | null>(null);
  const [houseNumber, setHouseNumber] = useState('');
  const [houseStreet, setHouseStreet] = useState('');
  const [instructions, setInstructions] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const addressLine =
    [areaName.trim(), houseStreet.trim()].filter(Boolean).join(', ') ||
    houseStreet.trim() ||
    areaName.trim();

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    const coords = await getCurrentLocation();
    if (!coords) {
      setLocating(false);
      toast.error('Could not get location. Enable location access in Settings.', 'Location');
      return;
    }
    if (!checkRawalpindi(coords.lat, coords.lng)) {
      setLocating(false);
      toast.warning(DELIVERY_ZONE_OUT_MESSAGE, DELIVERY_ZONE_TITLE);
      return;
    }
    setLat(coords.lat);
    setLng(coords.lng);
    const geocoded = await reverseGeocode(coords.lat, coords.lng);
    if (geocoded) {
      if (!houseStreet.trim()) setHouseStreet(geocoded.addressLine);
      if (!areaName.trim()) setAreaName(geocoded.city || 'Current location');
    } else if (!areaName.trim()) {
      setAreaName('Current location');
    }
    setLocating(false);
  };

  const handleSelectArea = (area: RawalpindiArea) => {
    setSelectedArea(area);
    setAreaName(area.name);
    if (area.latitude != null && area.longitude != null) {
      setLat(area.latitude);
      setLng(area.longitude);
    }
  };

  const handleOpenMaps = () => {
    const query =
      areaName.trim() || houseStreet.trim() || 'Rawalpindi, Pakistan';
    (Platform.OS === 'web' ? Linking : LinkingExpo).openURL(
      getGoogleMapsSearchUrl(query)
    );
  };

  const handleSave = async () => {
    if (!label.trim()) {
      toast.warning('Enter a label (e.g. Home, Office).', 'Required');
      return;
    }
    if (!areaName.trim() && !houseStreet.trim()) {
      toast.warning('Enter at least area name or house/street details.', 'Required');
      return;
    }
    if (lat === null || lng === null) {
      const resolved = coordsFromArea(areaName, selectedArea);
      if (resolved) {
        setLat(resolved.lat);
        setLng(resolved.lng);
      }
    }
    const saveLat = lat ?? coordsFromArea(areaName, selectedArea)?.lat ?? null;
    const saveLng = lng ?? coordsFromArea(areaName, selectedArea)?.lng ?? null;
    if (saveLat === null || saveLng === null) {
      toast.warning(
        'Select your area from the list, tap the map, or use GPS.',
        'Location required'
      );
      return;
    }
    if (!isInRawalpindi(saveLat, saveLng)) {
      toast.warning(DELIVERY_ZONE_OUT_MESSAGE, DELIVERY_ZONE_TITLE);
      return;
    }
    setLoading(true);
    const result = await addAddress({
      label: label.trim(),
      area: areaName.trim() || undefined,
      addressLine:
        addressLine ||
        houseStreet.trim() ||
        areaName.trim() ||
        'Delivery address',
      streetNumber: houseNumber.trim() || undefined,
      instructions: instructions.trim() || undefined,
      city: DEFAULT_CITY,
      latitude: saveLat,
      longitude: saveLng,
    });
    setLoading(false);
    if (result.ok && result.address) {
      await applySavedAddress(result.address);
      router.back();
    } else if (result.ok) {
      router.back();
    } else {
      toast.error(result.error ?? 'Failed to save', 'Error');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.hint, { color: colors.muted }]}>
        {DELIVERY_ZONE_INFO} Select your area below — map not required.
      </Text>

      <Text style={[styles.sectionLabel, { color: colors.text }]}>
        Select area (Rawalpindi)
      </Text>
      <AreaDropdown value={selectedArea} onChange={handleSelectArea} />

      <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <FontAwesome name="map-marker" size={22} color={colors.accent} />
        <View style={styles.locationCardText}>
          <Text style={[styles.locationCardTitle, { color: colors.text }]}>
            {selectedArea?.name || areaName.trim() || 'Choose an area'}
          </Text>
          <Text style={[styles.locationCardSub, { color: colors.muted }]}>
            {lat != null && lng != null
              ? checkRawalpindi(lat, lng)
                ? '✓ Location set in Rawalpindi'
                : '✗ Outside delivery area'
              : 'Pick an area from the list above'}
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.locationButton, { backgroundColor: colors.accentMuted, borderColor: colors.border }]}
        onPress={handleUseCurrentLocation}
        disabled={locating}
      >
        {locating ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <>
            <FontAwesome name="location-arrow" size={14} color={colors.accent} />
            <Text style={[styles.locationButtonText, { color: colors.accent }]}>
              Use my current location (GPS)
            </Text>
          </>
        )}
      </Pressable>

      <Text style={[styles.sectionLabel, { color: colors.text }]}>
        Address details
      </Text>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        Label (e.g. Home, Office)
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Home"
        placeholderTextColor={colors.muted}
        value={label}
        onChangeText={setLabel}
      />

      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        Area / locality (or edit above)
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="e.g. Satellite Town, Saddar"
        placeholderTextColor={colors.muted}
        value={areaName}
        onChangeText={(t) => {
          setAreaName(t);
          const match =
            RAWALPINDI_AREAS.find(
              (a) => a.name.toLowerCase() === t.trim().toLowerCase()
            ) ?? null;
          setSelectedArea(match);
          if (match) handleSelectArea(match);
        }}
      />

      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        House / street number
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="e.g. House 12, Block B"
        placeholderTextColor={colors.muted}
        value={houseNumber}
        onChangeText={setHouseNumber}
      />

      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        Street, block & landmark
      </Text>
      <TextInput
        style={[
          styles.input,
          styles.inputMulti,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Street name, block, nearby landmark"
        placeholderTextColor={colors.muted}
        value={houseStreet}
        onChangeText={setHouseStreet}
        multiline
      />

      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        Delivery instructions (optional)
      </Text>
      <TextInput
        style={[
          styles.input,
          styles.inputMulti,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Ring bell, gate code, etc."
        placeholderTextColor={colors.muted}
        value={instructions}
        onChangeText={setInstructions}
        multiline
      />

      {Platform.OS === 'web' && (
        <Pressable
          style={[
            styles.locationButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={handleUseCurrentLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={[styles.locationButtonText, { color: colors.muted }]}>
              Pin where I am now (GPS)
            </Text>
          )}
        </Pressable>
      )}

      <Pressable
        style={[
          styles.locationButton,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={handleOpenMaps}
      >
        <Text style={[styles.locationButtonText, { color: colors.text }]}>
          Open Google Maps to find address
        </Text>
      </Pressable>

      {lat !== null && lng !== null && (
        <Text style={[styles.coords, { color: colors.muted }]}>
          {checkRawalpindi(lat, lng)
            ? '✓ Location in Rawalpindi'
            : '✗ Outside delivery area'}
        </Text>
      )}
      {lat === null && lng === null && selectedArea && (
        <Text style={[styles.coords, { color: colors.muted }]}>
          Area selected — tap Save address
        </Text>
      )}

      <Pressable
        style={[styles.saveButton, { backgroundColor: colors.accent }]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving…' : 'Save address'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 13, marginBottom: 16 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  locationCardText: { flex: 1, minWidth: 0 },
  locationCardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  locationCardSub: { fontSize: 12, lineHeight: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  inputMulti: { height: 80, paddingTop: 12 },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  locationButtonText: { fontWeight: '600' },
  coords: { fontSize: 12, marginTop: 12, marginBottom: 16 },
  saveButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700' },
});
