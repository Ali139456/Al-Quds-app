import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatPKR } from '@/constants/currency';
import { Radius, Spacing } from '@/constants/Spacing';
import { shadowSm } from '@/constants/shadows';
import FoodImage from '@/components/FoodImage';
import { IMAGE_WIDTH } from '@/utils/resolveFoodImage';
import type { Deal } from '@/types';

type Props = {
  deal: Deal;
  variant?: 'grid' | 'featured';
};

export default function DealCard({ deal, variant = 'grid' }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const savings = deal.originalPrice > deal.dealPrice ? deal.originalPrice - deal.dealPrice : 0;
  const isFeatured = variant === 'featured';
  const outOfStock = deal.stockAvailable === false;

  return (
    <Pressable
      style={[
        styles.card,
        isFeatured && styles.featuredCard,
        shadowSm,
        { backgroundColor: colors.card, borderColor: colors.border },
        outOfStock && { opacity: 0.75 },
      ]}
      onPress={() => router.push(`/deal/${deal.id}`)}
    >
      <View style={[styles.imageArea, { backgroundColor: colors.borderLight }]}>
        <FoodImage image={deal.image} style={styles.photo} emojiStyle={styles.emoji} resizeMode="cover" width={IMAGE_WIDTH.deal} />
        {outOfStock ? (
          <View style={[styles.stockBadge, { backgroundColor: colors.danger }]}>
            <Text style={styles.stockBadgeText}>Out of stock</Text>
          </View>
        ) : null}
        {deal.badge ? (
          <View style={[styles.badge, { backgroundColor: colors.cta }]}>
            <Text style={styles.badgeText}>{deal.badge}</Text>
          </View>
        ) : savings > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.cta }]}>
            <Text style={styles.badgeText}>SAVE {formatPKR(savings)}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={isFeatured ? 2 : 2}>
          {deal.title}
        </Text>
        {deal.subtitle ? (
          <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
            {deal.subtitle}
          </Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={[styles.dealPrice, { color: colors.accent }]}>{formatPKR(deal.dealPrice)}</Text>
          {deal.originalPrice > deal.dealPrice ? (
            <Text style={[styles.originalPrice, { color: colors.muted }]}>{formatPKR(deal.originalPrice)}</Text>
          ) : null}
        </View>
        {isFeatured ? (
          <LinearGradient
            colors={[colors.accent, colors.accent + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>View deal</Text>
          </LinearGradient>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  featuredCard: {
    width: 260,
    marginBottom: 0,
  },
  imageArea: {
    aspectRatio: 1.15,
    position: 'relative',
    overflow: 'hidden',
  },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emoji: { fontSize: 56 },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    maxWidth: '90%',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    zIndex: 2,
  },
  stockBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  body: { padding: Spacing.sm, gap: 4 },
  title: { fontSize: 14, fontWeight: '800', lineHeight: 18 },
  subtitle: { fontSize: 11, lineHeight: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dealPrice: { fontSize: 15, fontWeight: '800' },
  originalPrice: { fontSize: 12, textDecorationLine: 'line-through' },
  ctaBtn: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
