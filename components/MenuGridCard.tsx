import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { FoodItem } from '@/types';
import { formatPKR } from '@/constants/currency';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Radius, Spacing } from '@/constants/Spacing';
import FoodImage from '@/components/FoodImage';

type Props = {
  item: FoodItem;
  imagePriority?: 'low' | 'normal' | 'high';
};

function defaultLineKey(foodId: string) {
  return `${foodId}||`;
}

export default function MenuGridCard({ item, imagePriority = 'normal' }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { items: cartItems, addItem, getLineKey } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(item.id);
  const key = defaultLineKey(item.id);
  const line = cartItems.find((i) => getLineKey(i) === key);
  const quantity = line?.quantity ?? 0;
  const isStandalone = item.category === 'fries' || item.category === 'drinks';
  const outOfStock = item.stockAvailable === false;

  const handleAdd = () => {
    if (outOfStock) return;
    if (isStandalone) addItem(item, 1);
    else router.push(`/food/${item.id}`);
  };

  return (
    <Pressable
      style={[styles.card, outOfStock && { opacity: 0.72 }]}
      onPress={() => (outOfStock ? undefined : router.push(`/food/${item.id}`))}
    >
      <View style={[styles.imageArea, { backgroundColor: colors.borderLight }]}>
        <FoodImage image={item.image} style={styles.photo} emojiStyle={styles.emoji} priority={imagePriority} />
        {outOfStock ? (
          <View style={[styles.stockOverlay, { backgroundColor: colors.dangerBg }]}>
            <Text style={[styles.stockOverlayText, { color: colors.danger }]}>Out of stock</Text>
          </View>
        ) : null}
        <Pressable
          style={[styles.favBtn, { backgroundColor: colors.page }]}
          onPress={(e) => {
            e.stopPropagation?.();
            toggleFavorite(item.id);
          }}
        >
          <FontAwesome name={fav ? 'heart' : 'heart-o'} size={14} color={fav ? colors.cta : colors.muted} />
        </Pressable>
        {quantity === 0 ? (
          !outOfStock ? (
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.page, borderColor: colors.border }]}
            onPress={(e) => {
              e.stopPropagation?.();
              handleAdd();
            }}
          >
            <Text style={[styles.addBtnText, { color: colors.text }]}>+</Text>
          </Pressable>
          ) : null
        ) : (
          <View style={[styles.qtyBadge, { backgroundColor: colors.text }]}>
            <Text style={[styles.qtyBadgeText, { color: colors.page }]}>{quantity}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.price, { color: colors.muted }]}>
        {item.varieties?.length ? 'from ' : ''}
        {formatPKR(item.price)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, marginBottom: Spacing.lg },
  imageArea: {
    aspectRatio: 1,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emoji: { fontSize: 56 },
  favBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  addBtn: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 16, fontWeight: '500', lineHeight: 18 },
  qtyBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  qtyBadgeText: { fontSize: 13, fontWeight: '800' },
  stockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  stockOverlayText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  name: { fontSize: 14, fontWeight: '700', lineHeight: 18, marginBottom: 4 },
  price: { fontSize: 13, fontWeight: '500' },
});
