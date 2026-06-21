import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Linking, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useOrderHistory } from '@/contexts/OrderHistoryContext';
import { useCart } from '@/contexts/CartContext';
import { useMenu } from '@/contexts/MenuContext';
import { useSettings } from '@/contexts/SettingsContext';
import { formatPKR } from '@/constants/currency';
import { Radius, Spacing } from '@/constants/Spacing';
import OrderTrackingStepper from '@/components/OrderTrackingStepper';
import OrderTrackingMap from '@/components/OrderTrackingMap';
import { orderToCartLines } from '@/utils/reorder';
import { API_BASE_URL } from '@/constants/api';
import { toast } from '@/contexts/ToastContext';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { distanceKm, estimateDeliveryMinutes } from '@/utils/geo';
import { formatOrderStatus, getOrderStatusMessage, isTrackableStatus } from '@/utils/orderStatus';
import type { OrderStatus, PastOrder } from '@/types';

function mapApiOrderDetail(r: Record<string, unknown>): PastOrder {
  const items = Array.isArray(r.items)
    ? r.items.map((it: Record<string, unknown>) => ({
        foodId: String(it.foodId ?? it.food_id ?? ''),
        name: String(it.name ?? ''),
        price: Number(it.price ?? 0),
        quantity: Number(it.quantity ?? 1),
        variety: it.variety ? String(it.variety) : undefined,
        addons: it.addons ? String(it.addons) : undefined,
        image: it.image ? String(it.image) : undefined,
      }))
    : [];
  return {
    id: String(r.id),
    userId: String(r.user_id ?? ''),
    items,
    total: Number(r.total ?? 0),
    subtotal: r.subtotal != null ? Number(r.subtotal) : undefined,
    addressLabel: String(r.address_label ?? 'Delivery'),
    addressLine: String(r.address_line ?? ''),
    status: String(r.status ?? 'placed') as PastOrder['status'],
    createdAt: String(r.created_at ?? new Date().toISOString()),
    paymentMethod: r.payment_method ? String(r.payment_method) : undefined,
    discountAmount: r.discount_amount != null ? Number(r.discount_amount) : undefined,
    deliveryFee: r.delivery_fee != null ? Number(r.delivery_fee) : undefined,
    specialInstructions: r.special_instructions ? String(r.special_instructions) : undefined,
    rating: r.rating != null ? Number(r.rating) : undefined,
    ratingComment: r.rating_comment ? String(r.rating_comment) : undefined,
  };
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { orders, refreshOrderHistory } = useOrderHistory();
  const { addItem, clearCart } = useCart();
  const { getFoodById } = useMenu();
  const { settings } = useSettings();
  const localOrder = orders.find((o) => o.id === id);
  const [fetchedOrder, setFetchedOrder] = useState<PastOrder | null>(null);
  const [fetching, setFetching] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const order = localOrder || fetchedOrder;
  const showLiveMap = !!order && isTrackableStatus(order.status);
  const { tracking, isLoading: trackingLoading, refresh: refreshTracking } = useOrderTracking(id, showLiveMap);
  const liveStatus = (tracking?.status as OrderStatus) || order?.status;

  useFocusEffect(
    useCallback(() => {
      refreshOrderHistory();
      if (showLiveMap) refreshTracking();
    }, [refreshOrderHistory, refreshTracking, showLiveMap])
  );

  useEffect(() => {
    if (localOrder || !id || !API_BASE_URL) return;
    setFetching(true);
    fetch(`${API_BASE_URL}/api/orders/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setFetchedOrder(mapApiOrderDetail(data));
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [localOrder, id]);

  const etaMinutes = useMemo(() => {
    if (
      !tracking?.riderLatitude ||
      !tracking?.riderLongitude ||
      tracking.deliveryLatitude == null ||
      tracking.deliveryLongitude == null
    ) {
      return null;
    }
    const km = distanceKm(
      tracking.riderLatitude,
      tracking.riderLongitude,
      tracking.deliveryLatitude,
      tracking.deliveryLongitude
    );
    return estimateDeliveryMinutes(km);
  }, [tracking]);

  const statusMessage = getOrderStatusMessage(
    liveStatus || order?.status || 'placed',
    liveStatus === 'out_for_delivery' ? etaMinutes : null
  );

  const handleReorder = useCallback(() => {
    if (!order) return;
    const lines = orderToCartLines(order, getFoodById);
    if (!lines.length) {
      toast.warning('Some items are no longer available.', 'Reorder');
      return;
    }
    clearCart();
    for (const line of lines) {
      const varietyMod = line.food.varieties?.find((v) => v.name === line.variety)?.priceModifier ?? 0;
      addItem(line.food, line.quantity, {
        variety: line.variety,
        varietyPriceModifier: varietyMod,
        addons: line.addons,
      });
    }
    toast.success('Items added to cart!', 'Reorder');
    router.push('/(tabs)/cart');
  }, [order, getFoodById, clearCart, addItem]);

  const handleRate = async () => {
    if (!order || !rating || !API_BASE_URL) return;
    try {
      await fetch(`${API_BASE_URL}/api/orders/${order.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      toast.success('Thanks for your feedback!', 'Rated');
    } catch (_) {
      toast.error('Could not submit rating.', 'Error');
    }
  };

  const whatsappSupport = () => {
    const msg = encodeURIComponent(`Hi Al-Quds, I need help with order ${order?.id}`);
    Linking.openURL(`https://wa.me/92${settings.supportWhatsapp.replace(/^0/, '')}?text=${msg}`);
  };

  if (fetching && !order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.page }]}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Loading order…</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.page }]}>
        <Text style={{ color: colors.muted }}>Order not found</Text>
      </View>
    );
  }

  const displayStatus = (liveStatus || order.status) as OrderStatus;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.page }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Order {order.id.replace('order_', '#')}</Text>
      <Text style={[styles.date, { color: colors.muted }]}>{new Date(order.createdAt).toLocaleString()}</Text>

      <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: colors.accentMuted }]}>
            <Text style={[styles.statusBadgeText, { color: colors.accent }]}>
              {formatOrderStatus(displayStatus)}
            </Text>
          </View>
          {displayStatus === 'out_for_delivery' && etaMinutes != null ? (
            <View style={[styles.etaPill, { backgroundColor: colors.accent }]}>
              <FontAwesome name="clock-o" size={12} color="#fff" />
              <Text style={styles.etaPillText}>{etaMinutes} min</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.statusMessage, { color: colors.text }]}>{statusMessage}</Text>
        {tracking?.addressLine ? (
          <Text style={[styles.addressLine, { color: colors.muted }]} numberOfLines={2}>
            <FontAwesome name="map-marker" size={12} color={colors.muted} /> {tracking.addressLine}
          </Text>
        ) : (
          <Text style={[styles.addressLine, { color: colors.muted }]} numberOfLines={2}>
            <FontAwesome name="map-marker" size={12} color={colors.muted} /> {order.addressLine}
          </Text>
        )}
      </View>

      <OrderTrackingStepper status={displayStatus} />

      {showLiveMap ? (
        <View style={styles.trackingSection}>
          <View style={styles.trackingHeader}>
            <Text style={[styles.trackingTitle, { color: colors.text }]}>Live map</Text>
            {trackingLoading ? <ActivityIndicator size="small" color={colors.accent} /> : null}
          </View>
          {tracking?.deliveryLatitude != null && tracking.deliveryLongitude != null ? (
            <OrderTrackingMap
              deliveryLat={tracking.deliveryLatitude}
              deliveryLng={tracking.deliveryLongitude}
              riderLat={tracking.riderLatitude}
              riderLng={tracking.riderLongitude}
              riderUpdatedAt={tracking.riderLocationUpdatedAt}
              height={260}
            />
          ) : (
            <View style={[styles.mapPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FontAwesome name="map" size={28} color={colors.muted} />
              <Text style={[styles.trackingWait, { color: colors.muted }]}>
                Map will appear once delivery location is saved for this order.
              </Text>
            </View>
          )}
        </View>
      ) : null}

      <Text style={[styles.sectionLabel, { color: colors.text }]}>Order items</Text>
      {order.items.length === 0 ? (
        <Text style={[styles.noItems, { color: colors.muted }]}>Item details loading…</Text>
      ) : (
        order.items.map((item, i) => (
          <View key={i} style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.itemName, { color: colors.text }]}>
              {item.quantity}x {item.name}
            </Text>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{formatPKR(item.price * item.quantity)}</Text>
            {item.variety || item.addons ? (
              <Text style={[styles.itemSub, { color: colors.muted }]}>
                {[item.variety, item.addons].filter(Boolean).join(', ')}
              </Text>
            ) : null}
          </View>
        ))
      )}

      <View style={[styles.summary, { borderColor: colors.border }]}>
        {order.discountAmount ? (
          <View style={styles.sumRow}>
            <Text style={{ color: colors.muted }}>Discount ({order.couponCode})</Text>
            <Text style={{ color: colors.cta }}>-{formatPKR(order.discountAmount)}</Text>
          </View>
        ) : null}
        {order.deliveryFee != null && order.deliveryFee > 0 ? (
          <View style={styles.sumRow}>
            <Text style={{ color: colors.muted }}>Delivery</Text>
            <Text style={{ color: colors.text }}>{formatPKR(order.deliveryFee)}</Text>
          </View>
        ) : null}
        <View style={styles.sumRow}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.totalVal, { color: colors.cta }]}>{formatPKR(order.total)}</Text>
        </View>
      </View>

      <Pressable style={[styles.btn, { backgroundColor: colors.cta }]} onPress={handleReorder}>
        <Text style={styles.btnText}>Reorder</Text>
      </Pressable>

      <Pressable style={[styles.btnOutline, { borderColor: colors.border }]} onPress={whatsappSupport}>
        <FontAwesome name="whatsapp" size={16} color="#25D366" />
        <Text style={[styles.btnOutlineText, { color: colors.text }]}>Contact support</Text>
      </Pressable>

      {order.status === 'delivered' && !order.rating ? (
        <View style={[styles.rateBox, { borderColor: colors.border }]}>
          <Text style={[styles.rateTitle, { color: colors.text }]}>Rate your order</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)}>
                <FontAwesome name={n <= rating ? 'star' : 'star-o'} size={28} color={colors.accent} />
              </Pressable>
            ))}
          </View>
          <TextInput
            style={[styles.comment, { borderColor: colors.border, color: colors.text }]}
            placeholder="Optional comment"
            placeholderTextColor={colors.muted}
            value={comment}
            onChangeText={setComment}
          />
          <Pressable style={[styles.btn, { backgroundColor: colors.accent }]} onPress={handleRate}>
            <Text style={styles.btnText}>Submit rating</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  loadingText: { fontSize: 13 },
  title: { fontSize: 22, fontWeight: '800' },
  date: { fontSize: 13, marginTop: 4, marginBottom: Spacing.md },
  statusCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  etaPillText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  statusMessage: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  addressLine: { fontSize: 12, lineHeight: 18 },
  trackingSection: { marginBottom: Spacing.md },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  trackingTitle: { fontSize: 16, fontWeight: '800' },
  trackingWait: { fontSize: 13, textAlign: 'center', marginTop: Spacing.sm },
  mapPlaceholder: {
    height: 180,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sectionLabel: { fontSize: 15, fontWeight: '800', marginBottom: Spacing.sm, marginTop: Spacing.sm },
  noItems: { fontSize: 13, fontStyle: 'italic', marginBottom: Spacing.md },
  row: { paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemSub: { fontSize: 12, marginTop: 2 },
  summary: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, gap: 8 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, fontWeight: '800' },
  totalVal: { fontSize: 18, fontWeight: '800' },
  btn: { marginTop: Spacing.md, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnOutline: {
    marginTop: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  btnOutlineText: { fontWeight: '700' },
  rateBox: { marginTop: Spacing.lg, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1 },
  rateTitle: { fontSize: 16, fontWeight: '800', marginBottom: Spacing.sm },
  stars: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  comment: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, fontSize: 14 },
});
