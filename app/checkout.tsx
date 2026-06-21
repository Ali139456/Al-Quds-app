import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform, TextInput, Switch, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useCart } from '@/contexts/CartContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import { useOrderHistory } from '@/contexts/OrderHistoryContext';
import { BRAND_NAME } from '@/constants/menu';
import { formatPKR } from '@/constants/currency';
import { normalizePakPhone, formatPakPhoneDisplay } from '@/utils/phone';
import { Radius, Spacing } from '@/constants/Spacing';
import { toast } from '@/contexts/ToastContext';
import OrderStepBar from '@/components/OrderStepBar';
import {
  PAYMENT_ACCOUNT,
  PAYMENT_METHODS,
  getPaymentLabel,
  type PaymentMethod,
} from '@/constants/payment';
import { useSettings } from '@/contexts/SettingsContext';
import { useLoyalty } from '@/contexts/LoyaltyContext';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/constants/api';
import type { CouponResult } from '@/types';
import { pickPaymentImageWeb, uploadPaymentProof } from '@/utils/uploadPayment';
import DeliveryZoneBanner from '@/components/DeliveryZoneBanner';
import { isAddressInDeliveryZone, DELIVERY_ZONE_OUT_MESSAGE } from '@/constants/location';

export default function CheckoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { items, totalItems, totalPrice, clearCart, getLineKey } = useCart();
  const {
    customerName,
    customerPhone,
    streetNumber,
    instructions,
    setCustomerName,
    setCustomerPhone,
    setStreetNumber,
    setInstructions,
    validateDelivery,
    getDeliveryAddress,
    getDeliveryLocationSummary,
    setShowSetupModal,
    isDeliveryReady,
  } = useDelivery();
  const { addOrder, orders } = useOrderHistory();
  const { user } = useAuth();
  const { getDeliveryFee, getDeliveryEta, settings } = useSettings();
  const { loyalty, calcPointsEarned } = useLoyalty();
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [contactless, setContactless] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [tip, setTip] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const stickyPad = insets.bottom + (Platform.OS === 'web' ? 8 : 0);
  const subtotal = totalPrice;
  const discount = coupon?.valid ? (coupon.discount ?? 0) : 0;
  const deliveryFee = getDeliveryFee(subtotal, coupon?.freeDelivery);
  const walletUsed = useWallet ? Math.min(loyalty.walletBalance, Math.max(0, subtotal - discount + deliveryFee + tip)) : 0;
  const grandTotal = Math.max(0, subtotal - discount + deliveryFee + tip - walletUsed);
  const pointsEarned = calcPointsEarned(grandTotal);

  const applyCoupon = async () => {
    if (!couponInput.trim() || !API_BASE_URL) {
      toast.warning('Enter a coupon code.', 'Coupon');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotal,
          userId: user?.id,
          isFirstOrder: orders.length === 0,
        }),
      });
      const data: CouponResult = await res.json();
      if (data.valid) {
        setCoupon(data);
        toast.success(data.description || 'Coupon applied!', 'Saved');
      } else {
        setCoupon(null);
        toast.error(data.error || 'Invalid coupon', 'Coupon');
      }
    } catch (_) {
      toast.error('Could not validate coupon.', 'Error');
    }
  };

  const handleUploadProof = async () => {
    setUploadingProof(true);
    try {
      const file = await pickPaymentImageWeb();
      if (!file) return;
      const url = await uploadPaymentProof(file);
      if (url) {
        setPaymentProofUrl(url);
        toast.success('Screenshot uploaded!', 'Payment');
      } else toast.error('Upload failed.', 'Error');
    } finally {
      setUploadingProof(false);
    }
  };

  useEffect(() => {
    if (items.length === 0) router.replace('/(tabs)/cart');
  }, [items.length]);

  const handlePlaceOrder = async () => {
    if (!settings.storeOpen) {
      toast.error('Store is closed. Please try again later.');
      return;
    }
    if (!validateDelivery()) return;
    const name = customerName.trim();
    const phone = normalizePakPhone(customerPhone)!;
    const address = getDeliveryAddress();
    if (!address) return;
    if (!isAddressInDeliveryZone(address)) {
      toast.error(DELIVERY_ZONE_OUT_MESSAGE, 'Outside delivery area');
      return;
    }

    const stockIssue = items.find(
      (line) =>
        line.food.stockAvailable === false ||
        line.quantity > (line.food.stockMaxQty ?? 999)
    );
    if (stockIssue) {
      toast.error(
        stockIssue.food.stockReason || `${stockIssue.food.name} is out of stock. Remove it from your cart.`,
        'Out of stock'
      );
      return;
    }

    const payLabel = getPaymentLabel(paymentMethod);
    const digitalNote =
      paymentMethod === 'digital'
        ? `\n\nPay ${formatPKR(grandTotal)} to ${PAYMENT_ACCOUNT.number} (${PAYMENT_ACCOUNT.name})`
        : '';
    const ok = await toast.confirm(
      'Place order?',
      `${name}\n${formatPakPhoneDisplay(phone)}\n\n${address.addressLine}\n\nPayment: ${payLabel}${digitalNote}\n\nTotal: ${formatPKR(grandTotal)}`,
      { confirmText: 'Place order', cancelText: 'Cancel' }
    );
    if (!ok) return;

    setPlacing(true);
    try {
      await addOrder(items, grandTotal, address, {
        customerName: name,
        customerPhone: phone,
        paymentMethod: payLabel,
        couponCode: coupon?.code,
        couponId: coupon?.couponId,
        discountAmount: discount,
        deliveryFee,
        subtotal,
        scheduledAt: scheduleTime.trim() || undefined,
        contactless,
        specialInstructions: instructions.trim() || undefined,
        paymentProofUrl: paymentProofUrl || undefined,
        tipAmount: tip,
        walletUsed,
        loyaltyPointsEarned: pointsEarned,
      });
      clearCart();
      if (paymentMethod === 'digital') {
        const msg = encodeURIComponent(`Al-Quds order placed. Total: ${formatPKR(grandTotal)}`);
        Linking.openURL(`https://wa.me/92${PAYMENT_ACCOUNT.number.replace(/^0/, '')}?text=${msg}`);
      }
      toast.success("Your Al-Quds order has been placed!", 'Thank you!');
      router.replace('/(tabs)/');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not place order.', 'Error');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.page }]}>
      <View style={styles.pageHead}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Checkout</Text>
        <Text style={[styles.pageSub, { color: colors.muted }]}>{BRAND_NAME}</Text>
      </View>

      <OrderStepBar current={3} />

      <DeliveryZoneBanner compact />

      <ScrollView
        contentContainerStyle={{ paddingBottom: stickyPad + 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Delivery address */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Delivery address</Text>
        <Pressable
          style={[styles.addressCard, { borderColor: colors.border }]}
          onPress={() => setShowSetupModal(true)}
        >
          <View style={[styles.mapThumb, { backgroundColor: colors.borderLight }]}>
            <FontAwesome name="map-marker" size={20} color={colors.cta} />
          </View>
          <View style={styles.addressText}>
            <Text style={[styles.addressMain, { color: colors.text }]} numberOfLines={2}>
              {getDeliveryLocationSummary()}
            </Text>
            <Text style={[styles.addressCity, { color: colors.muted }]}>
              {isDeliveryReady() ? 'Rawalpindi · delivery available' : 'Rawalpindi delivery required'}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.muted} />
        </Pressable>

        <View style={styles.notesBlock}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Note for rider</Text>
          <Text style={[styles.fieldHint, { color: colors.muted }]}>
            Gate code, ring bell, landmark — rider ko batayein
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.page },
            ]}
            placeholder="e.g. Blue gate, 2nd floor, call on arrival"
            placeholderTextColor={colors.muted}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Your details */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Your details</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.page }]}
          placeholder="Full name"
          placeholderTextColor={colors.muted}
          value={customerName}
          onChangeText={setCustomerName}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.page }]}
          placeholder="03XX XXXXXXX"
          placeholderTextColor={colors.muted}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.page }]}
          placeholder="House / street number"
          placeholderTextColor={colors.muted}
          value={streetNumber}
          onChangeText={setStreetNumber}
        />

        {/* Coupon */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Coupon code</Text>
        <View style={styles.couponRow}>
          <TextInput
            style={[styles.couponInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.page }]}
            placeholder="e.g. WELCOME50"
            placeholderTextColor={colors.muted}
            value={couponInput}
            onChangeText={setCouponInput}
            autoCapitalize="characters"
          />
          <Pressable style={[styles.couponBtn, { backgroundColor: colors.cta }]} onPress={applyCoupon}>
            <Text style={styles.couponBtnText}>Apply</Text>
          </Pressable>
        </View>
        {coupon?.valid ? (
          <Text style={[styles.couponApplied, { color: colors.cta }]}>
            ✓ {coupon.code} — {coupon.description}
          </Text>
        ) : null}

        {/* Delivery options */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Delivery options</Text>
        <Text style={[styles.etaLine, { color: colors.muted, marginHorizontal: Spacing.lg }]}>
          Estimated: {getDeliveryEta()}{settings.busyMode ? ' (busy — extra wait)' : ''}
        </Text>
        <View style={[styles.toggleRow, { marginHorizontal: Spacing.lg }]}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>Leave at the door</Text>
          <Switch value={contactless} onValueChange={setContactless} trackColor={{ true: colors.accent }} />
        </View>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.page }]}
          placeholder="Schedule for later (optional) e.g. 7:30 PM"
          placeholderTextColor={colors.muted}
          value={scheduleTime}
          onChangeText={setScheduleTime}
        />

        {/* Tip */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Tip your rider</Text>
        <View style={styles.tipRow}>
          {[0, 50, 100, 150].map((amt) => (
            <Pressable
              key={amt}
              style={[styles.tipChip, { borderColor: tip === amt ? colors.accent : colors.border, backgroundColor: tip === amt ? colors.accentMuted : colors.page }]}
              onPress={() => setTip(amt)}
            >
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{amt === 0 ? 'Not now' : formatPKR(amt)}</Text>
            </Pressable>
          ))}
        </View>

        {loyalty.walletBalance > 0 ? (
          <View style={[styles.toggleRow, { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm }]}>
            <Text style={{ color: colors.text }}>Use wallet ({formatPKR(loyalty.walletBalance)})</Text>
            <Switch value={useWallet} onValueChange={setUseWallet} trackColor={{ true: colors.accent }} />
          </View>
        ) : null}

        {loyalty.points > 0 ? (
          <Text style={[styles.loyaltyLine, { color: colors.muted }]}>
            🎁 {loyalty.points} loyalty points · earn +{pointsEarned} on this order
          </Text>
        ) : null}

        {/* Payment method */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Payment method</Text>
        {PAYMENT_METHODS.map((method) => {
          const selected = paymentMethod === method.id;
          return (
            <Pressable
              key={method.id}
              style={[
                styles.payOption,
                {
                  borderColor: selected ? colors.text : colors.border,
                  borderWidth: selected ? 2 : 1,
                  backgroundColor: colors.page,
                },
              ]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={[styles.radio, { borderColor: selected ? colors.text : colors.border }]}>
                {selected && <View style={[styles.radioDot, { backgroundColor: colors.text }]} />}
              </View>
              <View style={styles.payOptionBody}>
                <Text style={[styles.payTitle, { color: colors.text }]}>{method.title}</Text>
                <Text style={[styles.paySub, { color: colors.muted }]}>{method.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}

        {paymentMethod === 'digital' && (
          <View style={[styles.payInfoBox, { borderColor: colors.border, backgroundColor: colors.borderLight }]}>
            <Text style={[styles.payInfoTitle, { color: colors.text }]}>{PAYMENT_ACCOUNT.label}</Text>
            <Text style={[styles.payInfoRow, { color: colors.text }]}>
              <Text style={styles.payInfoLabel}>Account: </Text>
              {PAYMENT_ACCOUNT.number}
            </Text>
            <Text style={[styles.payInfoRow, { color: colors.text }]}>
              <Text style={styles.payInfoLabel}>Name: </Text>
              {PAYMENT_ACCOUNT.name}
            </Text>
            <Text style={[styles.payInfoNote, { color: colors.cta }]}>
              Send payment screenshot to {PAYMENT_ACCOUNT.number} after placing order
            </Text>
            <Pressable style={[styles.proofBtn, { borderColor: colors.border }]} onPress={handleUploadProof} disabled={uploadingProof}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {uploadingProof ? 'Uploading…' : paymentProofUrl ? '✓ Screenshot uploaded' : 'Upload payment screenshot'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Order summary */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Order summary</Text>
        {items.map((item) => {
          const { food, quantity, unitPrice, variety, addons } = item;
          const sub = [variety, addons?.map((a) => a.name).join(', ')].filter(Boolean).join(', ');
          return (
            <View key={getLineKey(item)} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryName, { color: colors.text }]}>
                  {quantity}x {food.name}
                </Text>
                {sub ? <Text style={[styles.summarySub, { color: colors.muted }]}>{sub}</Text> : null}
              </View>
              <Text style={[styles.summaryPrice, { color: colors.text }]}>{formatPKR(unitPrice * quantity)}</Text>
            </View>
          );
        })}

        <View style={[styles.billBox, { borderColor: colors.border }]}>
          <View style={styles.billRow}>
            <Text style={{ color: colors.text }}>Subtotal</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{formatPKR(subtotal)}</Text>
          </View>
          {discount > 0 ? (
            <View style={styles.billRow}>
              <Text style={{ color: colors.text }}>Discount</Text>
              <Text style={{ color: colors.cta, fontWeight: '700' }}>-{formatPKR(discount)}</Text>
            </View>
          ) : null}
          <View style={styles.billRow}>
            <Text style={{ color: colors.text }}>Delivery</Text>
            <Text style={{ color: deliveryFee === 0 ? colors.cta : colors.text, fontWeight: '700' }}>
              {deliveryFee === 0 ? 'Free' : formatPKR(deliveryFee)}
            </Text>
          </View>
          {tip > 0 ? (
            <View style={styles.billRow}>
              <Text style={{ color: colors.text }}>Rider tip</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{formatPKR(tip)}</Text>
            </View>
          ) : null}
          {walletUsed > 0 ? (
            <View style={styles.billRow}>
              <Text style={{ color: colors.text }}>Wallet</Text>
              <Text style={{ color: colors.cta, fontWeight: '700' }}>-{formatPKR(walletUsed)}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.stickyFooter, { backgroundColor: colors.page, borderTopColor: colors.border, paddingBottom: stickyPad }]}>
        <View style={styles.footerTop}>
          <View>
            <Text style={[styles.footerLabel, { color: colors.text }]}>Total (incl. fees)</Text>
            <Text style={[styles.footerSub, { color: colors.muted }]}>{totalItems} items</Text>
          </View>
          <Text style={[styles.footerPrice, { color: colors.cta }]}>{formatPKR(grandTotal)}</Text>
        </View>
        {!settings.storeOpen ? (
          <View style={[styles.closedCheckout, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}>
            <Text style={[styles.closedCheckoutText, { color: colors.danger }]}>
              Store is closed. Please try again later.
            </Text>
          </View>
        ) : null}
        <Pressable
          style={[
            styles.placeBtn,
            { backgroundColor: colors.cta },
            (placing || !settings.storeOpen || !isDeliveryReady()) && { opacity: 0.7 },
          ]}
          onPress={handlePlaceOrder}
          disabled={placing || !settings.storeOpen || !isDeliveryReady()}
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeBtnText}>
              {isDeliveryReady() ? 'Place order' : 'Set Rawalpindi address to order'}
            </Text>
          )}
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
  sectionLabel: { fontSize: 16, fontWeight: '800', marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  mapThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: { flex: 1 },
  addressMain: { fontSize: 14, fontWeight: '700' },
  addressCity: { fontSize: 12, marginTop: 2 },
  notesBlock: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  fieldHint: { fontSize: 12, marginBottom: Spacing.sm, lineHeight: 16 },
  input: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
  },
  notesInput: {
    marginHorizontal: 0,
    minHeight: 80,
    paddingTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  summaryName: { fontSize: 14, fontWeight: '700' },
  summarySub: { fontSize: 12, marginTop: 2 },
  summaryPrice: { fontSize: 14, fontWeight: '700' },
  billBox: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between' },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  payOptionBody: { flex: 1 },
  payTitle: { fontSize: 14, fontWeight: '700' },
  paySub: { fontSize: 12, marginTop: 2 },
  payInfoBox: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  payInfoTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  payInfoRow: { fontSize: 13, lineHeight: 18 },
  payInfoLabel: { fontWeight: '700' },
  payInfoNote: { fontSize: 12, fontWeight: '700', marginTop: Spacing.xs, lineHeight: 16 },
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
  placeBtn: { paddingVertical: 16, borderRadius: Radius.md, alignItems: 'center' },
  placeBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  closedCheckout: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  closedCheckoutText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  couponRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.xs },
  couponInput: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 44, fontSize: 14 },
  couponBtn: { paddingHorizontal: Spacing.lg, borderRadius: Radius.md, justifyContent: 'center' },
  couponBtnText: { color: '#fff', fontWeight: '800' },
  couponApplied: { marginHorizontal: Spacing.lg, fontSize: 12, fontWeight: '700', marginBottom: Spacing.sm },
  etaLine: { fontSize: 13, marginBottom: Spacing.sm },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  tipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  tipChip: { paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1 },
  loyaltyLine: { marginHorizontal: Spacing.lg, fontSize: 12, marginBottom: Spacing.sm },
  proofBtn: { marginTop: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
});
