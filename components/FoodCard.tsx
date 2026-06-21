import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { CategoryGradients } from '@/constants/Gradients';
import { useColorScheme } from '@/components/useColorScheme';
import { FoodItem } from '@/types';
import { formatPKR } from '@/constants/currency';
import { useCart } from '@/contexts/CartContext';
import { Radius, Spacing } from '@/constants/Spacing';
import { shadowLg, shadowSm } from '@/constants/shadows';
import { Typography } from '@/constants/Typography';
import FoodImage from '@/components/FoodImage';

interface FoodCardProps {
  item: FoodItem;
  variant?: 'list' | 'featured';
}

function defaultLineKey(foodId: string) {
  return `${foodId}||`;
}

export default function FoodCard({ item, variant = 'list' }: FoodCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const gradients = CategoryGradients[colorScheme ?? 'light'];
  const { items, addItem, updateQuantity, getLineKey } = useCart();
  const key = defaultLineKey(item.id);
  const line = items.find((i) => getLineKey(i) === key);
  const quantity = line?.quantity ?? 0;
  const catGradient = gradients[item.category as keyof typeof gradients] ?? gradients.burgers;
  const isStandalone = item.category === 'fries' || item.category === 'drinks';

  const handleAdd = () => {
    if (isStandalone) addItem(item, 1);
    else router.push(`/food/${item.id}`);
  };

  if (variant === 'featured') {
    return (
      <View style={[styles.featuredCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => router.push(`/food/${item.id}`)}
        >
          <LinearGradient
            colors={[catGradient[0] + '33', catGradient[1] + '11']}
            style={styles.featuredImageArea}
          >
            <FoodImage image={item.image} style={styles.featuredPhoto} emojiStyle={styles.featuredEmoji} resizeMode="cover" />
            <View style={[styles.ratingBadge, { backgroundColor: colors.card }]}>
              <Text style={[styles.ratingBadgeText, { color: colors.text }]}>★ {item.rating}</Text>
            </View>
          </LinearGradient>
          <View style={styles.featuredBody}>
            <Text style={[styles.featuredName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.featuredDesc, { color: colors.muted }]} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.featuredMeta}>
              <View>
                <Text style={[styles.featuredPrice, { color: colors.accent }]}>{formatPKR(item.price)}</Text>
                <Text style={[styles.featuredTime, { color: colors.muted }]}>{item.prepTime} min delivery</Text>
              </View>
              {quantity === 0 ? (
                <Pressable
                  style={({ pressed }) => [styles.featuredAddBtn, { backgroundColor: colors.accent }, pressed && styles.pressed]}
                  onPress={handleAdd}
                >
                  <Text style={styles.featuredAddText}>+</Text>
                </Pressable>
              ) : (
                <View style={styles.featuredQtyRow}>
                  <Pressable
                    style={[styles.featuredQtyBtn, { backgroundColor: colors.accentMuted }]}
                    onPress={() => updateQuantity(key, quantity - 1)}
                  >
                    <Text style={[styles.featuredQtyBtnText, { color: colors.accent }]}>−</Text>
                  </Pressable>
                  <Text style={[styles.featuredQtyNum, { color: colors.text }]}>{quantity}</Text>
                  <Pressable
                    style={[styles.featuredQtyBtn, { backgroundColor: colors.accent }]}
                    onPress={() => addItem(item, 1)}
                  >
                    <Text style={[styles.featuredQtyBtnText, { color: '#fff' }]}>+</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        style={({ pressed }) => [styles.listInner, pressed && styles.pressed]}
        onPress={() => router.push(`/food/${item.id}`)}
      >
        <LinearGradient
          colors={[catGradient[0] + '40', catGradient[1] + '20']}
          style={styles.listImage}
        >
          <Text style={styles.listEmoji}>{item.image}</Text>
        </LinearGradient>
        <View style={styles.listContent}>
          <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.listDesc, { color: colors.muted }]} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.listFooter}>
            <Text style={[styles.listPrice, { color: colors.accent }]}>{formatPKR(item.price)}</Text>
            <Text style={[styles.listMeta, { color: colors.muted }]}>★ {item.rating} · {item.prepTime}m</Text>
          </View>
        </View>
      </Pressable>

      {quantity === 0 ? (
        <Pressable
          style={({ pressed }) => [styles.listAddBtn, { backgroundColor: colors.accent }, pressed && styles.pressed]}
          onPress={handleAdd}
        >
          <Text style={styles.listAddText}>Add</Text>
        </Pressable>
      ) : (
        <View style={[styles.listQtyRow, { borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.listQtyBtn, { backgroundColor: colors.accentMuted }]}
            onPress={() => updateQuantity(key, quantity - 1)}
          >
            <Text style={[styles.listQtyBtnText, { color: colors.accent }]}>−</Text>
          </Pressable>
          <Text style={[styles.listQtyNum, { color: colors.text }]}>{quantity}</Text>
          <Pressable
            style={[styles.listQtyBtn, { backgroundColor: colors.accent }]}
            onPress={() => addItem(item, 1)}
          >
            <Text style={[styles.listQtyBtnText, { color: '#fff' }]}>+</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88 },

  // Featured variant
  featuredCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadowLg,
  },
  featuredImageArea: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  featuredPhoto: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featuredEmoji: { fontSize: 40 },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  ratingBadgeText: { fontSize: 11, fontWeight: '700' },
  featuredBody: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  featuredName: { ...Typography.h3, marginBottom: Spacing.xs },
  featuredDesc: { ...Typography.bodySm, marginBottom: Spacing.sm },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  featuredPrice: { fontSize: 16, fontWeight: '800' },
  featuredTime: { fontSize: 11, marginTop: 2 },
  featuredAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featuredAddText: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 18 },
  featuredQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredQtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredQtyBtnText: { fontSize: 15, fontWeight: '700' },
  featuredQtyNum: { fontSize: 16, fontWeight: '800', minWidth: 20, textAlign: 'center' },

  // List variant
  listCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...shadowSm,
  },
  listInner: { flexDirection: 'row' },
  listImage: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  listPhoto: { width: '100%', height: '100%' },
  listEmoji: { fontSize: 40 },
  listContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
    minWidth: 0,
  },
  listName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  listDesc: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  listPrice: { fontSize: 15, fontWeight: '800' },
  listMeta: { fontSize: 11 },
  listAddBtn: {
    margin: Spacing.md,
    marginTop: 0,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  listAddText: { color: '#fff', ...Typography.button },
  listQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listQtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listQtyBtnText: { fontSize: 16, fontWeight: '700' },
  listQtyNum: { fontSize: 15, fontWeight: '800', minWidth: 20, textAlign: 'center' },
});
