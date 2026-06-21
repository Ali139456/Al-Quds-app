import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking, ActivityIndicator, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useRider } from '@/contexts/RiderContext';
import { API_BASE_URL } from '@/constants/api';
import { formatPKR } from '@/constants/currency';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import type { RiderOrder } from '@/types';
import { toast } from '@/contexts/ToastContext';
import OrderTrackingMap from '@/components/OrderTrackingMap';
import RiderScreenHeader from '@/components/rider/RiderScreenHeader';
import { getRiderStatus } from '@/components/rider/riderUi';

function QuickAction({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  onPress: () => void;
  colors: (typeof Colors)['dark'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: colors.accentMuted }]}>
        <FontAwesome name={icon} size={16} color={colors.accent} />
      </View>
      <Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  icon,
  color,
  onPress,
  loading,
  outline,
  textColor,
}: {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  onPress: () => void;
  loading?: boolean;
  outline?: boolean;
  textColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.actionBtn,
        outline
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color }
          : { backgroundColor: color },
        { opacity: pressed || loading ? 0.85 : 1 },
      ]}
    >
      <FontAwesome name={icon} size={14} color={outline ? color : '#fff'} />
      <Text style={[styles.actionBtnText, { color: outline ? color : textColor || '#fff' }]}>
        {loading ? 'Please wait…' : label}
      </Text>
    </Pressable>
  );
}

export default function RiderDeliveryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();
  const { acceptOrder, updateOrderStatus, refresh } = useRider();
  const [order, setOrder] = useState<RiderOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id || !user || !API_BASE_URL) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/rider/orders/${id}?riderId=${encodeURIComponent(user.id)}`
      );
      if (res.ok) setOrder(await res.json());
    } catch (_) {
      toast.error('Could not load order', 'Error');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const runAction = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setActionLoading(true);
    const result = await fn();
    setActionLoading(false);
    if (result.ok) {
      await loadOrder();
      await refresh();
    } else {
      toast.error(result.error || 'Action failed', 'Error');
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <RiderScreenHeader title="Delivery" subtitle="Loading order…" showBack />
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <RiderScreenHeader title="Delivery" subtitle="Not found" showBack />
        <View style={styles.center}>
          <Text style={{ color: colors.muted }}>Order not found</Text>
        </View>
      </View>
    );
  }

  const shortId = order.id.replace('order_', '#');
  const status = getRiderStatus(order.status);
  const isMine = order.rider_id === user?.id;
  const canAccept = !order.rider_id && ['placed', 'confirmed', 'preparing'].includes(order.status);

  const openMaps = () => {
    if (order.latitude != null && order.longitude != null) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`
      );
    }
  };

  const callCustomer = () => {
    if (order.customer_phone) Linking.openURL(`tel:${order.customer_phone}`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RiderScreenHeader title={shortId} subtitle={status.label} showBack online />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Order total</Text>
              <Text style={[styles.summaryTotal, { color: colors.accent }]}>{formatPKR(order.total)}</Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: status.color + '22' }]}>
              <FontAwesome name={status.icon} size={12} color={status.color} />
              <Text style={[styles.statusChipText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={[styles.customerName, { color: colors.text }]}>
            {order.customer_name || 'Customer'}
          </Text>
          {order.customer_phone ? (
            <Text style={[styles.customerPhone, { color: colors.muted }]}>{order.customer_phone}</Text>
          ) : null}
        </View>

        <View style={styles.quickRow}>
          <QuickAction icon="phone" label="Call" onPress={callCustomer} colors={colors} />
          <QuickAction icon="map" label="Navigate" onPress={openMaps} colors={colors} />
        </View>

        {order.latitude != null && order.longitude != null ? (
          <View style={styles.mapSection}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>Drop-off location</Text>
            <OrderTrackingMap
              deliveryLat={order.latitude}
              deliveryLng={order.longitude}
              height={220}
              showLegend={false}
            />
          </View>
        ) : null}

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>Address</Text>
          <Text style={[styles.addressText, { color: colors.textSecondary }]}>{order.address_line}</Text>
          {order.special_instructions ? (
            <View style={[styles.noteBox, { backgroundColor: colors.accentMuted }]}>
              <FontAwesome name="sticky-note" size={12} color={colors.accent} />
              <Text style={[styles.noteText, { color: colors.text }]}>{order.special_instructions}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>Items</Text>
          {order.items?.map((item, idx) => (
            <View
              key={idx}
              style={[styles.itemRow, idx < (order.items?.length ?? 0) - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            >
              <View style={[styles.qtyBadge, { backgroundColor: colors.accentMuted }]}>
                <Text style={[styles.qtyText, { color: colors.accent }]}>{item.quantity}×</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.name}
                  {item.variety ? ` (${item.variety})` : ''}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.text }]}>{formatPKR(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          {canAccept ? (
            <ActionButton
              label="Accept order"
              icon="check"
              color={colors.accent}
              textColor="#1a1a1a"
              loading={actionLoading}
              onPress={() => runAction(() => acceptOrder(order.id))}
            />
          ) : null}

          {isMine && order.status === 'confirmed' ? (
            <ActionButton
              label="Picked up from restaurant"
              icon="shopping-bag"
              color={colors.accent}
              outline
              loading={actionLoading}
              onPress={() => runAction(() => updateOrderStatus(order.id, 'preparing'))}
            />
          ) : null}

          {isMine && (order.status === 'confirmed' || order.status === 'preparing') ? (
            <ActionButton
              label="Start delivery"
              icon="motorcycle"
              color="#3B82F6"
              loading={actionLoading}
              onPress={() => runAction(() => updateOrderStatus(order.id, 'out_for_delivery'))}
            />
          ) : null}

          {isMine && order.status === 'out_for_delivery' ? (
            <ActionButton
              label="Mark as delivered"
              icon="check-circle"
              color="#22C55E"
              loading={actionLoading}
              onPress={() => runAction(() => updateOrderStatus(order.id, 'delivered'))}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { ...Typography.caption },
  summaryTotal: { fontSize: 28, fontWeight: '800', marginTop: 2 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  statusChipText: { fontSize: 12, fontWeight: '800' },
  customerName: { ...Typography.h3, marginTop: Spacing.md },
  customerPhone: { ...Typography.bodySm, marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { ...Typography.button, fontSize: 13 },
  mapSection: { marginBottom: Spacing.md },
  blockTitle: { ...Typography.label, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  infoCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  addressText: { ...Typography.body, lineHeight: 22 },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  noteText: { flex: 1, ...Typography.bodySm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    minWidth: 36,
    alignItems: 'center',
  },
  qtyText: { fontSize: 12, fontWeight: '800' },
  itemInfo: { flex: 1 },
  itemName: { ...Typography.bodySm, fontWeight: '600' },
  itemPrice: { fontWeight: '700', fontSize: 13 },
  actions: { gap: Spacing.sm, marginTop: Spacing.md },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.lg,
  },
  actionBtnText: { ...Typography.button, fontSize: 15 },
});
