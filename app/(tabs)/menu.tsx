import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, TextInput, View, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { BRAND_NAME, CATEGORY_COLORS } from '@/constants/menu';
import MenuGridCard from '@/components/MenuGridCard';
import DealCard from '@/components/DealCard';
import StoreClosedBanner from '@/components/StoreClosedBanner';
import StickyCartBar, { STICKY_FOOTER_SCROLL_PAD } from '@/components/StickyCartBar';
import { useMenu } from '@/contexts/MenuContext';
import { useDeals } from '@/contexts/DealsContext';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Category } from '@/types';
import { Radius, Spacing } from '@/constants/Spacing';
import { shadowSm } from '@/constants/shadows';
import { getMenuGridColumns, gridItemWidth } from '@/utils/gridColumns';

type MenuTabId = Category | 'favorites' | 'all' | 'deals';

type MenuTab = {
  id: MenuTabId;
  label: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  emoji?: string;
};

const FALLBACK_TAB_COLORS = ['#D1AB66', '#FFB347', '#2EC4B6', '#E84855', '#9B5DE5', '#E8A820', '#3A9AD9'];

function tabAccent(id: MenuTabId, colors: (typeof Colors)['light'], index = 0) {
  if (id === 'all') return colors.accent;
  if (id === 'favorites') return '#E84855';
  if (id === 'deals') return '#E84855';
  return CATEGORY_COLORS[id] ?? FALLBACK_TAB_COLORS[index % FALLBACK_TAB_COLORS.length];
}

export default function MenuScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { items, categories } = useMenu();
  const { deals } = useDeals();

  const menuTabs: MenuTab[] = useMemo(
    () => [
      { id: 'all', label: 'Popular', icon: 'fire' },
      { id: 'deals', label: 'Deals', icon: 'tag' },
      { id: 'favorites', label: 'Favorites', icon: 'heart' },
      ...categories.map((c) => ({ id: c.id as Category, label: c.label, emoji: c.icon })),
    ],
    [categories]
  );
  const { totalItems } = useCart();
  const { settings, refreshSettings } = useSettings();
  const { favorites } = useFavorites();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string; filter?: string }>();
  const stickyPad = insets.bottom + (Platform.OS === 'web' ? 8 : 0);
  const gap = Spacing.md;
  const menuColumns = getMenuGridColumns(width);
  const colWidth = gridItemWidth(width, menuColumns, Spacing.lg * 2, gap);
  const listPerf = {
    initialNumToRender: 8,
    maxToRenderPerBatch: 6,
    windowSize: 5,
    removeClippedSubviews: Platform.OS !== 'web',
  };

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'favorites' | 'deals'>('all');

  useFocusEffect(
    useCallback(() => {
      if (params.filter === 'favorites') {
        setCategory('favorites');
      } else if (params.category === 'deals') {
        setCategory('deals');
      } else if (params.category && params.category !== 'all') {
        setCategory(params.category as Category);
      }
      refreshSettings();
    }, [params.filter, params.category, refreshSettings])
  );

  const filteredDeals = deals.filter((deal) => {
    if (category !== 'deals') return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      deal.title.toLowerCase().includes(q) ||
      (deal.subtitle ?? '').toLowerCase().includes(q) ||
      (deal.description ?? '').toLowerCase().includes(q)
    );
  });

  const filtered = items.filter((item) => {
    if (category === 'deals') return false;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      category === 'all'
        ? true
        : category === 'favorites'
          ? favorites.includes(item.id)
          : item.category === category;
    return matchSearch && matchCategory;
  });

  const cartBarOffset = totalItems > 0 ? stickyPad + STICKY_FOOTER_SCROLL_PAD : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.page }]}>
      <StoreClosedBanner />
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchWrap,
            shadowSm,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.searchIconWrap, { backgroundColor: colors.accentMuted }]}>
            <FontAwesome name="search" size={14} color={colors.accent} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search burgers, pasta, fried..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8} style={[styles.clearBtn, { backgroundColor: colors.borderLight }]}>
              <FontAwesome name="times" size={12} color={colors.muted} />
            </Pressable>
          ) : (
            <View style={[styles.searchFilter, { backgroundColor: colors.borderLight }]}>
              <FontAwesome name="sliders" size={13} color={colors.muted} />
            </View>
          )}
        </View>
      </View>

      <FlatList
        horizontal
        data={menuTabs}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsList}
        renderItem={({ item: tab, index }) => {
          const isActive = category === tab.id;
          const accent = tabAccent(tab.id, colors, index);
          const content = (
            <>
              {tab.icon ? (
                <View style={[styles.tabIconWrap, { backgroundColor: isActive ? `${accent}30` : colors.borderLight }]}>
                  <FontAwesome name={tab.icon} size={12} color={isActive ? accent : colors.muted} />
                </View>
              ) : (
                <View style={[styles.tabIconWrap, { backgroundColor: isActive ? `${accent}30` : colors.borderLight }]}>
                  <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                </View>
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.text : colors.muted, fontWeight: isActive ? '800' : '600' },
                ]}
              >
                {tab.label}
              </Text>
            </>
          );

          return (
            <Pressable onPress={() => setCategory(tab.id)} style={styles.tabPress}>
              {isActive ? (
                <LinearGradient
                  colors={[`${accent}35`, `${accent}12`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.tabChip, styles.tabChipActive, { borderColor: `${accent}55` }, shadowSm]}
                >
                  {content}
                </LinearGradient>
              ) : (
                <View style={[styles.tabChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {content}
                </View>
              )}
            </Pressable>
          );
        }}
      />

      {category === 'deals' ? (
        <FlatList
          data={filteredDeals}
          key={`deals-${menuColumns}`}
          keyExtractor={(item) => item.id}
          numColumns={menuColumns}
          columnWrapperStyle={{ gap, paddingHorizontal: Spacing.lg }}
          contentContainerStyle={{ paddingBottom: cartBarOffset || Spacing.xxxl }}
          style={styles.list}
          {...listPerf}
          renderItem={({ item, index }) => (
            <View style={{ width: colWidth }}>
              <DealCard deal={item} />
            </View>
          )}
          ListHeaderComponent={
            <View>
              <View style={styles.sectionHead}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionDot, { backgroundColor: tabAccent(category, colors) }]} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Deals & Combos</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.accentMuted }]}>
                    <Text style={[styles.countBadgeText, { color: colors.accent }]}>{filteredDeals.length}</Text>
                  </View>
                </View>
                <Text style={[styles.sectionSub, { color: colors.muted }]}>Special combos at discounted prices</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No deals right now</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filtered}
          key={`menu-${menuColumns}`}
          keyExtractor={(item) => item.id}
          numColumns={menuColumns}
          columnWrapperStyle={{ gap, paddingHorizontal: Spacing.lg }}
          contentContainerStyle={{ paddingBottom: cartBarOffset || Spacing.xxxl }}
          style={styles.list}
          {...listPerf}
          renderItem={({ item, index }) => (
            <View style={{ width: colWidth }}>
              <MenuGridCard item={item} imagePriority={index < 8 ? 'high' : 'normal'} />
            </View>
          )}
          ListHeaderComponent={
            <View>
              <View style={styles.sectionHead}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionDot, { backgroundColor: tabAccent(category, colors) }]} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {category === 'all'
                      ? 'Popular'
                      : category === 'favorites'
                        ? 'Favorites'
                        : categories.find((c) => c.id === category)?.label ?? category}
                  </Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.accentMuted }]}>
                    <Text style={[styles.countBadgeText, { color: colors.accent }]}>{filtered.length}</Text>
                  </View>
                </View>
                <Text style={[styles.sectionSub, { color: colors.muted }]}>
                  {category === 'all' ? `Most ordered at ${BRAND_NAME}` : `${filtered.length} items available`}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No dishes found</Text>
            </View>
          }
        />
      )}

      <StickyCartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  searchFilter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsList: { maxHeight: 52, marginBottom: Spacing.sm },
  tabs: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xs },
  tabPress: { marginRight: 2 },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tabChipActive: {
    borderWidth: 1.5,
  },
  tabIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: { fontSize: 13 },
  tabLabel: { fontSize: 13, letterSpacing: 0.2 },
  list: { flex: 1 },
  sectionHead: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, paddingTop: Spacing.xs },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '800', flex: 1 },
  countBadge: {
    minWidth: 28,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: { fontSize: 12, fontWeight: '800' },
  sectionSub: { fontSize: 12, marginTop: 6, marginLeft: 20 },
  empty: { padding: Spacing.xxxl, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
});
