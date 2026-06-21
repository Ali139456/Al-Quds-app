import { router } from 'expo-router';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useCart } from '@/contexts/CartContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import { BRAND_NAME } from '@/constants/menu';
import { formatPKR } from '@/constants/currency';
import { Radius, Spacing } from '@/constants/Spacing';
import OrderStepBar from '@/components/OrderStepBar';
import FoodImage from '@/components/FoodImage';
import { STICKY_FOOTER_SCROLL_PAD } from '@/components/StickyCartBar';
import StoreClosedBanner from '@/components/StoreClosedBanner';
import DeliveryZoneBanner from '@/components/DeliveryZoneBanner';
import { useSettings } from '@/contexts/SettingsContext';

export default function CartScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { items, removeItem, updateQuantity, totalItems, totalPrice, getLineKey } = useCart();
  const { getDeliveryLocationSummary, setShowSetupModal, isDeliveryReady } = useDelivery();
  const { settings } = useSettings();
  const canCheckout = settings.storeOpen && isDeliveryReady();

  const stickyPad = insets.bottom + (Platform.OS === 'web' ? 8 : 0);
  const deliveryFee = 0;

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.page }]}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
        <Pressable style={[styles.browseButton, { backgroundColor: colors.cta }]} onPress={() => router.push('/(tabs)/menu')}>
          <Text style={styles.browseButtonText}>Browse Menu</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.page }]}>
      <View style={styles.pageHead}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Cart</Text>
        <Text style={[styles.pageSub, { color: colors.muted }]}>{BRAND_NAME}</Text>
      </View>

      <OrderStepBar current={2} />

      <View style={[styles.deliveryRow, { borderColor: colors.border }]}>
        <Text style={[styles.deliveryText, { color: colors.text }]}>Delivery: 25–40 min</Text>
        <Pressable onPress={() => setShowSetupModal(true)}>
          <Text style={[styles.changeLink, { color: colors.text }]}>Change</Text>
        </Pressable>
      </View>
      <Text style={[styles.addressLine, { color: colors.muted }]} numberOfLines={1}>
        {getDeliveryLocationSummary()}
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: stickyPad + STICKY_FOOTER_SCROLL_PAD }}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const lineKey = getLineKey(item);
          const { food, quantity, unitPrice, variety, addons } = item;
          const subtitle = [variety, addons?.map((a) => a.name).join(', ')].filter(Boolean).join(', ');
          return (
            <View key={lineKey} style={[styles.cartRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.thumb, { backgroundColor: colors.borderLight }]}>
                <FoodImage image={food.image} style={styles.thumbPhoto} emojiStyle={styles.thumbEmoji} resizeMode="cover" />
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={2}>{food.name}</Text>
                  <Text style={[styles.rowPrice, { color: colors.text }]}>{formatPKR(unitPrice * quantity)}</Text>
                </View>
                {subtitle ? <Text style={[styles.rowSub, { color: colors.muted }]} numberOfLines={2}>{subtitle}</Text> : null}
                <View style={[styles.qtyPill, { borderColor: colors.border }]}>
                  <Pressable onPress={() => (quantity <= 1 ? removeItem(lineKey) : updateQuantity(lineKey, quantity - 1))} hitSlop={8}>
                    <FontAwesome name={quantity <= 1 ? 'trash-o' : 'minus'} size={12} color={colors.muted} />
                  </Pressable>
                  <Text style={[styles.qtyNum, { color: colors.text }]}>{quantity}</Text>
                  <Pressable onPress={() => updateQuantity(lineKey, quantity + 1)} hitSlop={8}>
                    <FontAwesome name="plus" size={12} color={colors.text} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        <Pressable style={styles.addMore} onPress={() => router.push('/(tabs)/menu')}>
          <FontAwesome name="plus" size={12} color={colors.text} />
          <Text style={[styles.addMoreText, { color: colors.text }]}>Add more items</Text>
        </Pressable>

        <View style={[styles.billBox, { borderColor: colors.border }]}>
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.text }]}>Subtotal</Text>
            <Text style={[styles.billValue, { color: colors.text }]}>{formatPKR(totalPrice)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.text }]}>Delivery</Text>
            <Text style={[styles.billFree, { color: colors.cta }]}>Free</Text>
          </View>
          <View style={[styles.billRow, styles.billTotal]}>
            <Text style={[styles.billTotalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.billTotalValue, { color: colors.text }]}>{formatPKR(totalPrice + deliveryFee)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.stickyFooter, { backgroundColor: colors.page, borderTopColor: colors.border, paddingBottom: stickyPad }]}>
        <View style={styles.footerTop}>
          <View>
            <Text style={[styles.footerLabel, { color: colors.text }]}>Total (incl. fees)</Text>
            <Text style={[styles.footerSub, { color: colors.muted }]}>{totalItems} items</Text>
          </View>
          <Text style={[styles.footerPrice, { color: colors.cta }]}>{formatPKR(totalPrice)}</Text>
        </View>
        <Pressable
          style={[styles.checkoutBtn, { backgroundColor: colors.cta }, !canCheckout && { opacity: 0.55 }]}
          onPress={() => (isDeliveryReady() ? router.push('/checkout') : setShowSetupModal(true))}
          disabled={!canCheckout}
        >
          <Text style={styles.checkoutBtnText}>
            {!settings.storeOpen
              ? 'Store closed — try later'
              : isDeliveryReady()
                ? 'Go to checkout'
                : 'Set Rawalpindi delivery address'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHead: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  pageTitle: { fontSize: 26, fontWeight: '800' },
  pageSub: { fontSize: 13, marginTop: 2 },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    marginTop: Spacing.xs,
  },
  deliveryText: { fontSize: 13, fontWeight: '600' },
  changeLink: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  addressLine: { fontSize: 12, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  scroll: { flex: 1 },
  cartRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbPhoto: { width: '100%', height: '100%' },
  thumbEmoji: { fontSize: 36 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  rowName: { flex: 1, fontSize: 14, fontWeight: '700' },
  rowPrice: { fontSize: 14, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  qtyNum: { fontSize: 14, fontWeight: '800', minWidth: 16, textAlign: 'center' },
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  addMoreText: { fontSize: 14, fontWeight: '700' },
  billBox: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between' },
  billLabel: { fontSize: 14 },
  billValue: { fontSize: 14, fontWeight: '600' },
  billFree: { fontSize: 14, fontWeight: '700' },
  billTotal: { marginTop: Spacing.xs, paddingTop: Spacing.sm, borderTopWidth: 0 },
  billTotalLabel: { fontSize: 16, fontWeight: '800' },
  billTotalValue: { fontSize: 16, fontWeight: '800' },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  footerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  footerLabel: { fontSize: 14, fontWeight: '700' },
  footerSub: { fontSize: 11, marginTop: 2 },
  footerPrice: { fontSize: 20, fontWeight: '800' },
  checkoutBtn: {
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl },
  emptyEmoji: { fontSize: 52, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: Spacing.xl },
  browseButton: { paddingVertical: 14, paddingHorizontal: Spacing.xxl, borderRadius: Radius.md },
  browseButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
