import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import type { CartItem } from '@/types';
import { formatPKR } from '@/constants/currency';
import Colors from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import AddonChips from '@/components/AddonChips';
import FoodImage from '@/components/FoodImage';
import { IMAGE_WIDTH } from '@/utils/resolveFoodImage';

type CartItemRowProps = {
  item: CartItem;
  colorScheme?: 'light' | 'dark' | null;
  showQuantity?: boolean;
  trailing?: React.ReactNode;
};

export default function CartItemRow({
  item,
  colorScheme,
  showQuantity = false,
  trailing,
}: CartItemRowProps) {
  const colors = Colors[colorScheme ?? 'dark'];
  const { food, quantity, unitPrice, variety, addons } = item;
  const lineTotal = unitPrice * quantity;

  return (
    <View
      style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.itemEmojiWrap, { backgroundColor: colors.accentMuted }]}>
        <FoodImage image={food.image} style={styles.itemPhoto} emojiStyle={styles.itemEmoji} resizeMode="cover" width={IMAGE_WIDTH.thumb} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.text }]}>{food.name}</Text>
        {variety ? (
          <Text style={[styles.itemVariety, { color: colors.muted }]}>Size: {variety}</Text>
        ) : null}
        {addons && addons.length > 0 ? (
          <AddonChips addons={addons} colorScheme={colorScheme} />
        ) : null}
        <Text style={[styles.itemPrice, { color: colors.accent }]}>
          {formatPKR(lineTotal)}
          {showQuantity ? ` · Qty ${quantity}` : ''}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  cartItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  itemEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemPhoto: { width: '100%', height: '100%' },
  itemEmoji: { fontSize: 24 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemVariety: { fontSize: 11, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', marginTop: 6 },
});
