import { StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useDelivery } from '@/contexts/DeliveryContext';
import {
  DELIVERY_ZONE_INFO,
  DELIVERY_ZONE_OUT_MESSAGE,
  DELIVERY_ZONE_REQUIRED_MESSAGE,
} from '@/constants/location';
import { Radius, Spacing } from '@/constants/Spacing';

type Props = {
  compact?: boolean;
  showInfoWhenReady?: boolean;
};

export default function DeliveryZoneBanner({ compact, showInfoWhenReady }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { getDeliveryZoneStatus } = useDelivery();
  const status = getDeliveryZoneStatus();

  if (status === 'in_zone') {
    if (!showInfoWhenReady) return null;
    return (
      <View
        style={[
          styles.banner,
          compact && styles.bannerCompact,
          { backgroundColor: colors.accentMuted, borderColor: colors.accent + '55' },
        ]}
      >
        <FontAwesome name="map-marker" size={compact ? 16 : 18} color={colors.accent} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{DELIVERY_ZONE_INFO}</Text>
      </View>
    );
  }

  const isOutside = status === 'out_of_zone';
  const title = isOutside ? "We don't deliver here" : 'Delivery location required';
  const message = isOutside ? DELIVERY_ZONE_OUT_MESSAGE : DELIVERY_ZONE_REQUIRED_MESSAGE;

  return (
    <View
      style={[
        styles.banner,
        compact && styles.bannerCompact,
        { backgroundColor: colors.dangerBg, borderColor: colors.danger },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
        <FontAwesome name="ban" size={compact ? 18 : 22} color={colors.danger} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.danger }]}>{title}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{message}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{DELIVERY_ZONE_INFO}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  bannerCompact: {
    marginHorizontal: 0,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
