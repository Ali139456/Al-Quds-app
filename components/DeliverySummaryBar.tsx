import { View, StyleSheet, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useDelivery } from '@/contexts/DeliveryContext';
import { Radius, Spacing } from '@/constants/Spacing';

export default function DeliverySummaryBar() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { getDeliverySummary, isDeliveryReady, setShowSetupModal } = useDelivery();

  return (
    <Pressable
      style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setShowSetupModal(true)}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.accentMuted }]}>
        <FontAwesome name="map-marker" size={14} color={colors.accent} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: colors.muted }]}>
          {isDeliveryReady() ? 'Delivering to' : 'Set delivery address'}
        </Text>
        <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
          {getDeliverySummary()}
        </Text>
      </View>
      <FontAwesome name="chevron-right" size={12} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 3 },
  value: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
});
