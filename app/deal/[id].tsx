import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPKR } from '@/constants/currency';
import { useCart } from '@/contexts/CartContext';
import { useDeals } from '@/contexts/DealsContext';
import { API_BASE_URL } from '@/constants/api';
import type { Deal } from '@/types';
import FoodImage from '@/components/FoodImage';
import { useToast } from '@/contexts/ToastContext';

export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { getDealById, refreshDeals } = useDeals();
  const { show } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { refreshDeals(); }, [refreshDeals]));

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const cached = getDealById(id);
    if (cached?.items?.length) {
      setDeal(cached);
      setLoading(false);
      return;
    }
    if (!API_BASE_URL) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/api/deals/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDeal({
            id: String(data.id),
            title: String(data.title ?? ''),
            subtitle: String(data.subtitle ?? ''),
            description: String(data.description ?? ''),
            image: String(data.image ?? '🎁'),
            dealPrice: Number(data.dealPrice) || 0,
            originalPrice: Number(data.originalPrice) || 0,
            menuItemIds: Array.isArray(data.menuItemIds) ? data.menuItemIds : [],
            badge: String(data.badge ?? ''),
            sortOrder: Number(data.sortOrder) || 0,
            stockAvailable: data.stockAvailable !== false,
            stockMaxQty: data.stockMaxQty != null ? Number(data.stockMaxQty) : undefined,
            stockReason: data.stockReason != null ? String(data.stockReason) : null,
            items: Array.isArray(data.items) ? data.items : [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, getDealById]);

  const handleAddDeal = () => {
    if (!deal?.items?.length || deal.stockAvailable === false) return;
    deal.items.forEach((item) => {
      const isStandalone = item.category === 'fries' || item.category === 'drinks';
      if (isStandalone) {
        addItem(item, 1);
      } else {
        addItem(item, 1, {
          variety: item.varieties?.[0]?.name,
          varietyPriceModifier: item.varieties?.[0]?.priceModifier ?? 0,
        });
      }
    });
    show(`${deal.title} added to cart`);
    router.push('/(tabs)/cart');
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.page }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!deal) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.page }]}>
        <Text style={{ color: colors.text }}>Deal not found.</Text>
      </View>
    );
  }

  const savings = deal.originalPrice > deal.dealPrice ? deal.originalPrice - deal.dealPrice : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.page }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={[styles.hero, { backgroundColor: colors.borderLight }]}>
          <FoodImage image={deal.image} style={styles.heroPhoto} emojiStyle={styles.heroEmoji} resizeMode="cover" />
          {deal.badge ? (
            <View style={[styles.badge, { backgroundColor: colors.cta }]}>
              <Text style={styles.badgeText}>{deal.badge}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{deal.title}</Text>
          {deal.subtitle ? (
            <Text style={[styles.subtitle, { color: colors.muted }]}>{deal.subtitle}</Text>
          ) : null}
          {deal.description ? (
            <Text style={[styles.description, { color: colors.muted }]}>{deal.description}</Text>
          ) : null}

          <View style={styles.priceBlock}>
            <Text style={[styles.dealPrice, { color: colors.accent }]}>{formatPKR(deal.dealPrice)}</Text>
            {deal.originalPrice > deal.dealPrice ? (
              <Text style={[styles.originalPrice, { color: colors.muted }]}>{formatPKR(deal.originalPrice)}</Text>
            ) : null}
            {savings > 0 ? (
              <Text style={[styles.savings, { color: colors.cta }]}>You save {formatPKR(savings)}</Text>
            ) : null}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Included items</Text>
          {(deal.items ?? []).map((item) => (
            <Pressable
              key={item.id}
              style={[styles.itemRow, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => router.push(`/food/${item.id}`)}
            >
              <View style={[styles.itemThumb, { backgroundColor: colors.borderLight }]}>
                <FoodImage image={item.image} style={styles.itemPhoto} emojiStyle={styles.itemEmoji} />
              </View>
              <View style={styles.itemBody}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.itemPrice, { color: colors.muted }]}>{formatPKR(item.price)}</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: colors.page, borderTopColor: colors.border }]}>
        <Pressable style={styles.addBtnWrap} onPress={handleAddDeal} disabled={deal.stockAvailable === false}>
          <LinearGradient
            colors={deal.stockAvailable === false ? [colors.muted, colors.muted] : [colors.accent, colors.accent + 'DD']}
            style={[styles.addBtn, deal.stockAvailable === false && { opacity: 0.7 }]}
          >
            <Text style={styles.addBtnText}>
              {deal.stockAvailable === false ? (deal.stockReason || 'Out of stock') : `Add deal to cart · ${formatPKR(deal.dealPrice)}`}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 220, position: 'relative' },
  heroPhoto: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroEmoji: { fontSize: 72 },
  badge: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  content: { padding: Spacing.lg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: Spacing.sm },
  description: { fontSize: 13, lineHeight: 20, marginBottom: Spacing.lg },
  priceBlock: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.xl },
  dealPrice: { fontSize: 22, fontWeight: '800' },
  originalPrice: { fontSize: 15, textDecorationLine: 'line-through' },
  savings: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: Spacing.md },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  itemThumb: { width: 56, height: 56, borderRadius: Radius.md, overflow: 'hidden' },
  itemPhoto: { width: '100%', height: '100%' },
  itemEmoji: { fontSize: 28 },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemPrice: { fontSize: 12, marginTop: 2 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  addBtnWrap: { borderRadius: Radius.full, overflow: 'hidden' },
  addBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: Radius.full },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
