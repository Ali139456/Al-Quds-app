import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPKR } from '@/constants/currency';
import { useCart } from '@/contexts/CartContext';
import { useMenu } from '@/contexts/MenuContext';
import { DEFAULT_ADDONS, groupAddons, isFriesAddon } from '@/constants/addons';
import type { Variety, Addon } from '@/types';
import FoodImage from '@/components/FoodImage';

function Radio({ selected, colors }: { selected: boolean; colors: (typeof Colors)['light'] }) {
  return (
    <View style={[styles.radio, { borderColor: selected ? colors.text : colors.border }]}>
      {selected && <View style={[styles.radioDot, { backgroundColor: colors.text }]} />}
    </View>
  );
}

function Checkbox({ checked, colors }: { checked: boolean; colors: (typeof Colors)['light'] }) {
  return (
    <View style={[styles.checkbox, { borderColor: checked ? colors.text : colors.border, backgroundColor: checked ? colors.text : 'transparent' }]}>
      {checked && <FontAwesome name="check" size={10} color={colors.page} />}
    </View>
  );
}

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { getFoodById, allAddons, refreshMenu } = useMenu();

  useFocusEffect(useCallback(() => { refreshMenu(); }, [refreshMenu]));

  const item = id ? getFoodById(id) : null;
  const [selectedVariety, setSelectedVariety] = useState<Variety | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [quantity, setQuantity] = useState(1);

  const defaultVarietyForPrice = item?.varieties?.[0];
  const varietyModifier = (selectedVariety ?? defaultVarietyForPrice)?.priceModifier ?? 0;
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const unitPrice = (item?.price ?? 0) + varietyModifier + addonsTotal;
  const lineTotal = unitPrice * quantity;

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id) ? prev.filter((a) => a.id !== addon.id) : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    if (!item || item.stockAvailable === false) return;
    const maxQty = item.stockMaxQty ?? 999;
    if (quantity > maxQty) return;
    const variety = selectedVariety ?? item.varieties?.[0];
    addItem(item, quantity, {
      quantity,
      variety: variety?.name,
      varietyPriceModifier: variety?.priceModifier ?? 0,
      addons: selectedAddons.length > 0 ? selectedAddons : undefined,
    });
    router.back();
  };

  if (!item) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.page }]}>
        <Text style={{ color: colors.text }}>Item not found.</Text>
      </View>
    );
  }

  const isStandalone = item.category === 'fries' || item.category === 'drinks';
  const outOfStock = item.stockAvailable === false;
  const maxStockQty = item.stockMaxQty ?? 99;
  const hasVarieties = !isStandalone && !!item.varieties?.length;
  const availableAddons =
    item.addons?.length ? item.addons : allAddons.length ? allAddons : DEFAULT_ADDONS;
  const { fries: friesAddons, drinks: drinkAddons } = groupAddons(availableAddons);
  const allAddonList = [...friesAddons, ...drinkAddons];
  const hasAddons = !isStandalone && allAddonList.length > 0;
  const effectiveVariety = selectedVariety ?? item.varieties?.[0] ?? null;
  const stickyPad = insets.bottom + (Platform.OS === 'web' ? 8 : 0);

  const selectionSummary = [
    effectiveVariety?.name,
    ...selectedAddons.map((a) => a.name),
  ].filter(Boolean).join(', ');

  const renderSectionHead = (title: string, sub: string, badge: string) => (
    <View style={[styles.sectionHead, { borderBottomColor: colors.border }]}>
      <View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.sectionSub, { color: colors.muted }]}>{sub}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.borderLight }]}>
        <Text style={[styles.badgeText, { color: colors.muted }]}>{badge}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.page }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: stickyPad + 88 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.borderLight }]}>
          <FoodImage image={item.image} style={styles.heroImg} emojiStyle={styles.heroEmoji} resizeMode="cover" />
        </View>

        <View style={styles.heroInfo}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.itemDesc, { color: colors.muted }]}>{item.description}</Text>
          <Text style={[styles.itemPrice, { color: colors.text }]}>{formatPKR(item.price)}</Text>
          {outOfStock ? (
            <View style={[styles.stockBanner, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}>
              <Text style={[styles.stockBannerText, { color: colors.danger }]}>
                {item.stockReason || 'Out of stock'}
              </Text>
            </View>
          ) : null}
        </View>

        {selectionSummary ? (
          <View style={[styles.summaryCard, { borderColor: colors.border }]}>
            <Text style={[styles.summaryText, { color: colors.muted }]} numberOfLines={2}>
              {selectionSummary}
            </Text>
            <Text style={[styles.summaryPrice, { color: colors.text }]}>{formatPKR(lineTotal)}</Text>
          </View>
        ) : null}

        {hasVarieties && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            {renderSectionHead('Choose size', 'Done', 'Completed')}
            {(item.varieties ?? []).map((v) => {
              const selected = effectiveVariety?.name === v.name;
              return (
                <Pressable
                  key={v.name}
                  style={[styles.optionRow, { borderBottomColor: colors.border }]}
                  onPress={() => setSelectedVariety(v)}
                >
                  <View style={styles.optionLeft}>
                    <Text style={[styles.optionName, { color: colors.text }]}>{v.name}</Text>
                    <Text style={[styles.optionPrice, { color: colors.muted }]}>
                      {v.priceModifier > 0 ? `+${formatPKR(v.priceModifier)}` : 'Free'}
                    </Text>
                  </View>
                  <Radio selected={selected} colors={colors} />
                </Pressable>
              );
            })}
          </View>
        )}

        {hasAddons && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            {renderSectionHead('Frequently bought together', 'Other customers also ordered these', 'Optional')}
            {allAddonList.map((a) => {
              const checked = selectedAddons.some((x) => x.id === a.id);
              return (
                <Pressable
                  key={a.id}
                  style={[styles.optionRow, { borderBottomColor: colors.border }]}
                  onPress={() => toggleAddon(a)}
                >
                  <Text style={styles.optionThumb}>{isFriesAddon(a) ? '🍟' : '🥤'}</Text>
                  <View style={styles.optionLeft}>
                    <Text style={[styles.optionName, { color: colors.text }]}>{a.name}</Text>
                    <Text style={[styles.optionPrice, { color: colors.muted }]}>+{formatPKR(a.price)}</Text>
                  </View>
                  <Checkbox checked={checked} colors={colors} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom — Foodpanda style */}
      <View style={[styles.stickyBar, { backgroundColor: colors.page, borderTopColor: colors.border, paddingBottom: stickyPad }]}>
        <View style={styles.qtyRow}>
          <Pressable
            style={[styles.qtyBtn, { borderColor: colors.border }]}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={[styles.qtyBtnText, { color: colors.text }]}>−</Text>
          </Pressable>
          <Text style={[styles.qtyNum, { color: colors.text }]}>{quantity}</Text>
          <Pressable
            style={[styles.qtyBtn, { borderColor: colors.border }]}
            onPress={() => setQuantity((q) => Math.min(maxStockQty, q + 1))}
            disabled={outOfStock}
          >
            <Text style={[styles.qtyBtnText, { color: colors.text }]}>+</Text>
          </Pressable>
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.cta }, outOfStock && { opacity: 0.5 }]}
          onPress={handleAddToCart}
          disabled={outOfStock}
        >
          <Text style={styles.addBtnText}>
            {outOfStock ? 'Out of stock' : `Add to cart · ${formatPKR(lineTotal)}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImg: { width: '100%', height: '100%' },
  heroEmoji: { fontSize: 88 },
  heroInfo: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  itemName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  itemDesc: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  itemPrice: { fontSize: 15, fontWeight: '700' },
  stockBanner: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  stockBannerText: { fontSize: 13, fontWeight: '700' },
  summaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryText: { flex: 1, fontSize: 12 },
  summaryPrice: { fontSize: 14, fontWeight: '800' },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionSub: { fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: 10, fontWeight: '700' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  optionThumb: { fontSize: 28 },
  optionLeft: { flex: 1 },
  optionName: { fontSize: 14, fontWeight: '600' },
  optionPrice: { fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '600' },
  qtyNum: { fontSize: 16, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  addBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
