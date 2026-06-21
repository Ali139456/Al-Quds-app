import { router } from 'expo-router';
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useAddress } from '@/contexts/AddressContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

type Props = {
  compact?: boolean;
};

export default function DeliveryDetailsForm({ compact }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { addresses, selectedAddress } = useAddress();
  const {
    customerName,
    customerPhone,
    streetNumber,
    instructions,
    guestAddressLine,
    guestLat,
    guestLng,
    gettingLocation,
    setCustomerName,
    setCustomerPhone,
    setStreetNumber,
    setInstructions,
    setGuestAddressLine,
    getPhoneError,
    handleUseCurrentLocation,
    handleAddressBlur,
    applySavedAddress,
  } = useDelivery();

  const phoneError = getPhoneError();

  const sectionStyle = compact
    ? [styles.sectionCard, styles.sectionCardCompact, { borderColor: colors.border }]
    : [styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }];

  return (
    <View style={compact ? styles.compactWrap : undefined}>
      <View style={sectionStyle}>
        <View style={[styles.sectionHeader, compact && styles.sectionHeaderCompact]}>
          <FontAwesome name="user" size={compact ? 14 : 16} color={colors.accent} />
          <Text style={[compact ? styles.sectionTitleCompact : styles.sectionTitle, { color: colors.text }]}>
            Your details
          </Text>
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Full name"
          placeholderTextColor={colors.muted}
          value={customerName}
          onChangeText={setCustomerName}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: phoneError && customerPhone ? colors.danger : colors.border,
              color: colors.text,
            },
          ]}
          placeholder="03XX XXXXXXX"
          placeholderTextColor={colors.muted}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
          maxLength={16}
        />
        {phoneError && customerPhone ? (
          <Text style={[styles.fieldError, { color: colors.danger }]}>{phoneError}</Text>
        ) : (
          <Text style={[styles.fieldHint, { color: colors.muted }]}>
            Pakistani mobile (03XX XXXXXXX or +92 3XX XXXXXXX)
          </Text>
        )}
      </View>

      <View style={sectionStyle}>
        <View style={[styles.sectionHeader, compact && styles.sectionHeaderCompact]}>
          <FontAwesome name="map-marker" size={compact ? 14 : 16} color={colors.accent} />
          <Text style={[compact ? styles.sectionTitleCompact : styles.sectionTitle, { color: colors.text }]}>
            Delivery address
          </Text>
        </View>
        <Text style={[styles.sectionHint, { color: colors.muted }]}>Rawalpindi only</Text>

        {user && addresses.length > 0 ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.addressScroll}>
              {addresses.map((addr) => {
                const selected = selectedAddress?.id === addr.id;
                return (
                  <Pressable
                    key={addr.id}
                    style={[
                      styles.addressChip,
                      { borderColor: colors.border, backgroundColor: colors.background },
                      selected && { borderColor: colors.accent, backgroundColor: colors.accentMuted },
                    ]}
                    onPress={() => void applySavedAddress(addr)}
                  >
                    <Text style={[styles.addressChipLabel, { color: colors.text }]}>{addr.label}</Text>
                    <Text style={[styles.addressChipLine, { color: colors.muted }]} numberOfLines={2}>
                      {addr.area ? `${addr.area}, ` : ''}
                      {addr.addressLine}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                style={[styles.addLocationChip, { borderColor: colors.accent }]}
                onPress={() => router.push('/add-address')}
              >
                <FontAwesome name="plus" size={14} color={colors.accent} />
                <Text style={[styles.addLocationText, { color: colors.accent }]}>Add another{'\n'}location</Text>
              </Pressable>
            </ScrollView>
          </>
        ) : user ? (
          <Pressable
            style={[styles.addFirstLocation, { backgroundColor: colors.accentMuted }]}
            onPress={() => router.push('/add-address')}
          >
            <FontAwesome name="plus-circle" size={16} color={colors.accent} />
            <Text style={[styles.addFirstLocationText, { color: colors.accent }]}>Add delivery location</Text>
          </Pressable>
        ) : (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Street, area, landmark"
              placeholderTextColor={colors.muted}
              value={guestAddressLine}
              onChangeText={setGuestAddressLine}
              onBlur={handleAddressBlur}
            />
            <Pressable
              style={[styles.locationBtn, { backgroundColor: colors.accentMuted }]}
              onPress={handleUseCurrentLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <FontAwesome name="location-arrow" size={14} color={colors.accent} />
                  <Text style={[styles.locationBtnText, { color: colors.accent }]}>Use current location</Text>
                </>
              )}
            </Pressable>
            {guestLat !== null && guestLng !== null && (
              <Text style={[styles.guestCoords, { color: colors.success }]}>
                ✓ Location confirmed in Rawalpindi
              </Text>
            )}
          </>
        )}

        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="House / street number"
          placeholderTextColor={colors.muted}
          value={streetNumber}
          onChangeText={setStreetNumber}
        />
        <TextInput
          style={[
            styles.input,
            styles.instructionsInput,
            { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Delivery instructions (e.g. ring bell, gate code)"
          placeholderTextColor={colors.muted}
          value={instructions}
          onChangeText={setInstructions}
          multiline
          numberOfLines={2}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactWrap: { gap: Spacing.sm },
  sectionCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionCardCompact: {
    padding: Spacing.md,
    paddingTop: 0,
    borderWidth: 0,
    marginBottom: Spacing.sm,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionHeaderCompact: { marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h3 },
  sectionTitleCompact: { fontSize: 14, fontWeight: '700' },
  sectionHint: { ...Typography.caption, marginBottom: Spacing.sm, marginTop: -Spacing.sm },
  input: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    marginBottom: Spacing.xs,
  },
  instructionsInput: { minHeight: 72, textAlignVertical: 'top' },
  fieldError: { fontSize: 12, marginBottom: Spacing.sm, fontWeight: '600' },
  fieldHint: { fontSize: 12, marginBottom: Spacing.sm },
  addressScroll: { marginBottom: Spacing.sm },
  addressChip: {
    width: 160,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  addressChipLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  addressChipLine: { fontSize: 11, lineHeight: 15 },
  addLocationChip: {
    width: 110,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addLocationText: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 15 },
  addFirstLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  addFirstLocationText: { fontSize: 14, fontWeight: '600' },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
  },
  locationBtnText: { fontSize: 14, fontWeight: '600' },
  guestCoords: { fontSize: 12, marginBottom: Spacing.sm, fontWeight: '600' },
});
