import { View, StyleSheet, Pressable, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { formatPKR } from '@/constants/currency';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import type { RiderOrder } from '@/types';
import { getRiderStatus } from '@/components/rider/riderUi';
import { formatOrderDateTime } from '@/utils/dateGroups';

type Colors = {
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  shadow: string;
};

type Props = {
  order: RiderOrder;
  colors: Colors;
  onPress: () => void;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'active' | 'completed';
};

export default function RiderOrderCard({
  order,
  colors,
  onPress,
  actionLabel,
  onAction,
  variant = 'default',
}: Props) {
  const shortId = order.id.replace('order_', '#');
  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const status = getRiderStatus(order.status);
  const accentBar = variant === 'active' ? '#60A5FA' : variant === 'completed' ? '#4ADE80' : status.color;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
          ...Platform.select({
            ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
            android: { elevation: 3 },
            default: {},
          }),
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accentBar }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View>
            <Text style={[styles.orderId, { color: colors.text }]}>{shortId}</Text>
            <Text style={[styles.customer, { color: colors.muted }]}>
              {order.customer_name || 'Customer'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
            <FontAwesome name={status.icon} size={10} color={status.color} />
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={[styles.addressRow, { backgroundColor: colors.accent + '0C' }]}>
          <FontAwesome name="map-marker" size={12} color={colors.accent} />
          <Text style={[styles.address, { color: colors.text }]} numberOfLines={2}>
            {order.address_line}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.meta}>
            <Text style={[styles.metaText, { color: colors.muted }]}>
              {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatOrderDateTime(order.created_at)}
            </Text>
            <Text style={[styles.total, { color: colors.accent }]}>{formatPKR(order.total)}</Text>
          </View>
          {actionLabel && onAction ? (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={(e) => {
                e.stopPropagation?.();
                onAction();
              }}
            >
              <Text style={styles.actionText}>{actionLabel}</Text>
              <FontAwesome name="chevron-right" size={10} color="#1a1a1a" />
            </Pressable>
          ) : (
            <FontAwesome name="chevron-right" size={12} color={colors.muted} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  accentBar: { width: 4 },
  body: { flex: 1, padding: Spacing.md },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  orderId: { ...Typography.h3 },
  customer: { ...Typography.caption, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  address: { flex: 1, ...Typography.bodySm, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  meta: { gap: 2 },
  metaText: { ...Typography.caption },
  total: { fontSize: 15, fontWeight: '800' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  actionText: { color: '#1a1a1a', fontWeight: '800', fontSize: 12 },
});
