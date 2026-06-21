import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import StoreClosedBanner from '@/components/StoreClosedBanner';
import { useSettings } from '@/contexts/SettingsContext';
import { ScrollView, StyleSheet, Pressable, View, useWindowDimensions, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { CategoryGradients } from '@/constants/Gradients';
import { useColorScheme } from '@/components/useColorScheme';
import { MENU_ITEMS, BRAND_NAME } from '@/constants/menu';
import FoodCard from '@/components/FoodCard';
import OrderAgainSection from '@/components/OrderAgainSection';
import BannerSlider from '@/components/BannerSlider';
import DealsSection from '@/components/DealsSection';
import { useBanners } from '@/hooks/useBanners';
import { useMenu } from '@/contexts/MenuContext';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { resolveFoodImageUri } from '@/utils/resolveFoodImage';
import FoodImage from '@/components/FoodImage';
import { EXPLORE_COLUMNS, gridItemWidth } from '@/utils/gridColumns';

const hotItemIds = ['b1', 'b3', 'a4', 'f5', 'c1', 'p1'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const gradients = CategoryGradients[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const [bannerRefresh, setBannerRefresh] = useState(0);
  useFocusEffect(useCallback(() => {
    setBannerRefresh((n) => n + 1);
  }, []));
  const banners = useBanners(bannerRefresh);
  const { refreshSettings } = useSettings();
  const { categories } = useMenu();

  useFocusEffect(
    useCallback(() => {
      refreshSettings();
    }, [refreshSettings])
  );

  const hotItems = MENU_ITEMS.filter((item) => hotItemIds.includes(item.id));
  const exploreGap = Spacing.sm;
  const exploreCardWidth = gridItemWidth(width, EXPLORE_COLUMNS, Spacing.lg * 2, exploreGap);
  const featuredCardWidth = width * 0.72;

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <StoreClosedBanner />

      {/* Greeting header */}
      <View style={styles.greetingRow}>
        <View style={styles.greetingText}>
          <Text style={[styles.greeting, { color: colors.muted }]}>{getGreeting()} 👋</Text>
          <Text style={[styles.brandTitle, { color: colors.text }]}>Hungry? Order from {BRAND_NAME}</Text>
        </View>
      </View>

      {/* Search shortcut */}
      <Pressable
        style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/(tabs)/menu')}
      >
        <FontAwesome name="search" size={16} color={colors.muted} />
        <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>Search burgers, pasta, fried...</Text>
        <View style={[styles.searchFilter, { backgroundColor: colors.accentMuted }]}>
          <FontAwesome name="sliders" size={14} color={colors.accent} />
        </View>
      </Pressable>

      <BannerSlider banners={banners} />

      <DealsSection />

      <OrderAgainSection />

      {/* Explore Menu */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore Menu</Text>
        <Pressable onPress={() => router.push('/(tabs)/menu')} hitSlop={8}>
          <Text style={[styles.viewAll, { color: colors.accent }]}>VIEW ALL</Text>
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(cat) => cat.id}
        numColumns={EXPLORE_COLUMNS}
        scrollEnabled={false}
        columnWrapperStyle={[styles.exploreRow, { gap: exploreGap }]}
        contentContainerStyle={styles.exploreGrid}
        renderItem={({ item: cat, index }) => (
          <Pressable
            style={[
              styles.exploreCard,
              { width: exploreCardWidth, backgroundColor: colors.card },
            ]}
            onPress={() => router.push(`/(tabs)/menu?category=${cat.id}`)}
          >
            {resolveFoodImageUri(cat.image) ? (
              <FoodImage
                image={cat.image}
                style={styles.explorePhoto}
                emojiStyle={styles.exploreEmoji}
                priority={index < 6 ? 'high' : 'normal'}
              />
            ) : (
              <View style={[styles.exploreFallback, { backgroundColor: colors.surface }]}>
                <Text style={styles.exploreEmoji}>{cat.icon || '🍽️'}</Text>
              </View>
            )}
            <Text style={[styles.exploreLabel, { color: colors.text }]} numberOfLines={1}>
              {cat.label}
            </Text>
          </Pressable>
        )}
      />

      {/* Hot items */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 Hot Items</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Most loved dishes</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hotScroll}
        style={styles.hotScrollView}
        decelerationRate="fast"
        snapToInterval={featuredCardWidth + Spacing.md}
      >
        {hotItems.map((item) => (
          <View key={item.id} style={[styles.hotCardWrap, { width: featuredCardWidth }]}>
            <FoodCard item={item} variant="featured" />
          </View>
        ))}
      </ScrollView>

      {/* Promo strip */}
      <LinearGradient
        colors={[colors.accent + '22', gradients.chinese[0] + '18']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.promoStrip, { borderColor: colors.border }]}
      >
        <Text style={styles.promoEmoji}>🛵</Text>
        <View style={styles.promoText}>
          <Text style={[styles.promoTitle, { color: colors.text }]}>Free delivery on orders above Rs. 1,500</Text>
          <Text style={[styles.promoSub, { color: colors.muted }]}>Rawalpindi only · 25–40 min</Text>
        </View>
      </LinearGradient>

      <View style={styles.footerNote}>
        <Text style={[styles.footerText, { color: colors.muted }]}>
          Delivery & pickup available. Minimum order may apply.
        </Text>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingBottom: 120,
    paddingTop: Spacing.sm,
  },
  greetingRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  greetingText: { flex: 1 },
  greeting: { ...Typography.label, marginBottom: Spacing.xs },
  brandTitle: { ...Typography.h2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
  },
  searchPlaceholder: { flex: 1, fontSize: 14 },
  searchFilter: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionTitle: { ...Typography.h2 },
  sectionSubtitle: { ...Typography.bodySm, marginTop: 2 },
  viewAll: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  exploreGrid: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  exploreRow: {
    marginBottom: Spacing.sm,
  },
  exploreCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
  },
  explorePhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  exploreFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreEmoji: { fontSize: 24 },
  exploreLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: 2,
  },
  hotScrollView: {
    marginBottom: Spacing.xl,
  },
  hotScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  hotCardWrap: {},
  promoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  promoEmoji: { fontSize: 28 },
  promoText: { flex: 1 },
  promoTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  promoSub: { fontSize: 11, marginTop: 2 },
  footerNote: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  footerText: { fontSize: 11, textAlign: 'center' },
});
