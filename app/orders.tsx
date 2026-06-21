import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useOrderHistory } from '@/contexts/OrderHistoryContext';
import Logo from '@/components/Logo';
import { formatPKR } from '@/constants/currency';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { formatOrderStatus, isActiveOrder } from '@/utils/orderStatus';
import { formatOrderDateTime, groupItemsByDate } from '@/utils/dateGroups';
import type { PastOrder } from '@/types';

function OrderCard({
  order,
  colors,
  variant,
  onPress,
  onRate,
}: {
  order: PastOrder;
  colors: (typeof Colors)['light'];
  variant: 'active' | 'past';
  onPress: () => void;
  onRate?: () => void;
}) {
  const needsRating = order.status === 'delivered' && !order.rating;

  return (
    <Pressable
      style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.orderTop}>
        <Text style={[styles.orderId, { color: colors.text }]}>{order.id.replace('order_', '#')}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                order.status === 'delivered' ? colors.success + '22' : colors.accentMuted,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: order.status === 'delivered' ? colors.success : colors.accent },
            ]}
          >
            {formatOrderStatus(order.status)}
          </Text>
        </View>
      </View>
      <Text style={[styles.orderAddress, { color: colors.muted }]} numberOfLines={2}>
        {order.addressLabel} · {order.addressLine}
      </Text>
      <View style={styles.orderBottom}>
        <Text style={[styles.orderTotal, { color: colors.accent }]}>{formatPKR(order.total)}</Text>
        <Text style={[styles.orderDate, { color: colors.muted }]}>
          {formatOrderDateTime(order.createdAt)}
        </Text>
      </View>

      {variant === 'active' ? (
        <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
          <FontAwesome name="map-marker" size={12} color={colors.accent} />
          <Text style={[styles.footerHint, { color: colors.accent }]}>Track on map & live updates</Text>
          <FontAwesome name="chevron-right" size={11} color={colors.accent} />
        </View>
      ) : needsRating ? (
        <Pressable
          style={[styles.footerRow, styles.rateRow, { borderTopColor: colors.border }]}
          onPress={(e) => {
            e.stopPropagation?.();
            onRate?.();
          }}
        >
          <FontAwesome name="star" size={12} color={colors.accent} />
          <Text style={[styles.footerHint, { color: colors.accent }]}>Rate this order</Text>
          <FontAwesome name="chevron-right" size={11} color={colors.accent} />
        </Pressable>
      ) : order.rating ? (
        <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <FontAwesome
                key={n}
                name={n <= (order.rating ?? 0) ? 'star' : 'star-o'}
                size={12}
                color={colors.accent}
              />
            ))}
          </View>
          <Text style={[styles.ratedText, { color: colors.muted }]}>Rated</Text>
        </View>
      ) : (
        <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.ratedText, { color: colors.muted }]}>View order details</Text>
          <FontAwesome name="chevron-right" size={11} color={colors.muted} />
        </View>
      )}
    </Pressable>
  );
}

export default function OrdersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { orders, refreshOrderHistory } = useOrderHistory();

  useFocusEffect(
    useCallback(() => {
      refreshOrderHistory();
    }, [refreshOrderHistory])
  );

  const activeOrders = useMemo(() => orders.filter((o) => isActiveOrder(o.status)), [orders]);
  const pastOrders = useMemo(
    () => orders.filter((o) => !isActiveOrder(o.status)),
    [orders]
  );
  const pastByDate = useMemo(
    () => groupItemsByDate(pastOrders, (o) => o.createdAt),
    [pastOrders]
  );

  if (!user) {
    return (
      <View style={[styles.guestContainer, { backgroundColor: colors.background }]}>
        <Logo size={80} style={styles.guestLogo} />
        <Text style={[styles.guestTitle, { color: colors.text }]}>My Orders</Text>
        <Text style={[styles.guestSubtitle, { color: colors.muted }]}>
          Login to track active deliveries and rate completed orders.
        </Text>
        <Pressable style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={() => router.push('/auth/login')}>
          <Text style={styles.primaryBtnText}>Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>My orders</Text>
      <Text style={[styles.pageSub, { color: colors.muted }]}>
        Track active deliveries and view your order history.
      </Text>

      <Text style={[styles.sectionLabel, { color: colors.text }]}>Active</Text>

      {activeOrders.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No active orders</Text>
          <Text style={[styles.emptySub, { color: colors.muted }]}>
            When you place an order, it will show here until it is delivered.
          </Text>
          <Pressable
            style={[styles.exploreBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/(tabs)/menu')}
          >
            <Text style={styles.exploreBtnText}>Browse menu</Text>
          </Pressable>
        </View>
      ) : (
        activeOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            colors={colors}
            variant="active"
            onPress={() => router.push(`/order/${order.id}`)}
          />
        ))
      )}

      <Text style={[styles.sectionLabel, { color: colors.text, marginTop: Spacing.lg }]}>
        Previous orders{pastOrders.length > 0 ? ` (${pastOrders.length})` : ''}
      </Text>

      {pastOrders.length === 0 ? (
        <View style={[styles.emptyPast, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyPastText, { color: colors.muted }]}>No previous orders yet.</Text>
        </View>
      ) : (
        pastByDate.map((group) => (
          <View key={group.key}>
            <Text style={[styles.dateGroupLabel, { color: colors.muted }]}>
              {group.label} · {group.items.length} order{group.items.length > 1 ? 's' : ''}
            </Text>
            {group.items.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                colors={colors}
                variant="past"
                onPress={() => router.push(`/order/${order.id}`)}
                onRate={() => router.push(`/order/${order.id}`)}
              />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  guestLogo: { marginBottom: Spacing.xl },
  guestTitle: { ...Typography.h1, marginBottom: Spacing.sm, textAlign: 'center' },
  guestSubtitle: { ...Typography.bodySm, textAlign: 'center', marginBottom: Spacing.xxl },
  primaryBtn: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
  },
  primaryBtnText: { color: '#1a1a1a', ...Typography.button, fontSize: 16 },
  pageTitle: { ...Typography.h1, marginBottom: 4 },
  pageSub: { ...Typography.bodySm, marginBottom: Spacing.md },
  sectionLabel: { ...Typography.h3, marginBottom: Spacing.sm },
  dateGroupLabel: { ...Typography.label, marginBottom: Spacing.sm, marginTop: Spacing.xs, letterSpacing: 0 },
  emptyPast: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyPastText: { ...Typography.bodySm },
  emptyCard: {
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 44, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h2, marginBottom: Spacing.xs },
  emptySub: { ...Typography.bodySm, textAlign: 'center', marginBottom: Spacing.lg },
  exploreBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.lg },
  exploreBtnText: { color: '#1a1a1a', fontWeight: '800', fontSize: 14 },
  orderCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  orderId: { fontWeight: '800', fontSize: 15 },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderAddress: { fontSize: 13, lineHeight: 18 },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  orderTotal: { fontWeight: '800', fontSize: 16 },
  orderDate: { fontSize: 12 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rateRow: {},
  footerHint: { flex: 1, fontSize: 12, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 3, flex: 1 },
  ratedText: { fontSize: 12, fontWeight: '600' },
});
