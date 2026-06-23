import React from 'react';
import { View, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useCart } from '@/contexts/CartContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { shadowFab } from '@/constants/shadows';

const BAR_HEIGHT = 78;
const FAB_SIZE = 72;
const FAB_HALF = FAB_SIZE / 2;
const FAB_COLOR = '#D1AB66';
const ACTIVE_COLOR = '#D1AB66';
const TAB_ICON_SIZE = 20;
const FAB_GAP = FAB_SIZE + 24;
const FAB_DROP = 14;

const TAB_CONFIG: Record<string, { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  menu: { icon: 'cutlery', label: 'Menu' },
  cart: { icon: 'shopping-cart', label: 'Cart' },
  account: { icon: 'user', label: 'Account' },
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isLight = colorScheme !== 'dark';

  const barBg = colors.tabBar;
  const inactiveColor = isLight ? '#78716C' : '#9CA3AF';
  const barBorder = isLight ? 'rgba(28, 25, 23, 0.08)' : 'rgba(255,255,255,0.06)';

  const safeBottom = Math.max(insets.bottom, Platform.OS === 'web' ? 8 : 0);
  const barTotalHeight = BAR_HEIGHT + safeBottom;
  const wrapperHeight = barTotalHeight;

  const routes = state.routes;

  const renderTab = (route: (typeof routes)[0], index: number) => {
    const focused = state.index === index;
    const config = TAB_CONFIG[route.name] ?? { icon: 'circle', label: route.name };
    const tint = focused ? ACTIVE_COLOR : inactiveColor;
    const showBadge = route.name === 'cart' && totalItems > 0;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={styles.tabButton}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={config.label}
      >
        <View style={styles.iconWrap}>
          <FontAwesome name={config.icon} size={TAB_ICON_SIZE} color={tint} />
          {showBadge && (
            <View style={[styles.badge, { borderColor: barBg }]}>
              <Text style={styles.badgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, { color: tint }]}>{config.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrapper, { height: wrapperHeight, pointerEvents: 'box-none' }]}>
      <View
        style={[
          styles.bar,
          {
            height: barTotalHeight,
            backgroundColor: barBg,
            borderTopColor: barBorder,
          },
        ]}
      />

      <View style={[styles.tabRow, { height: BAR_HEIGHT, bottom: safeBottom }]}>
        <View style={styles.side}>{renderTab(routes[0], 0)}</View>
        <View style={styles.side}>{renderTab(routes[1], 1)}</View>
        <View style={styles.fabSpacer} />
        <View style={styles.side}>{renderTab(routes[2], 2)}</View>
        <View style={styles.side}>{renderTab(routes[3], 3)}</View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: barTotalHeight - FAB_HALF - FAB_DROP,
            opacity: pressed ? 0.92 : 1,
            transform: [{ translateX: -FAB_HALF }, { scale: pressed ? 0.96 : 1 }],
          },
        ]}
        onPress={() => router.push('/(tabs)/menu')}
        accessibilityRole="button"
        accessibilityLabel="Browse menu"
      >
        <LinearGradient
          colors={['#E5C992', '#D1AB66', '#B89550']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.fabGradient}
        />
        <View style={styles.fabRing} />
        <View style={styles.fabPlusWrap}>
          <View style={styles.fabPlusBarH} />
          <View style={styles.fabPlusBarV} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignSelf: 'stretch',
    position: 'relative',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  tabRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  side: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabSpacer: {
    width: FAB_GAP,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' as const, cursor: 'pointer' as const },
      default: {},
    }),
  },
  iconWrap: {
    position: 'relative',
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: FAB_COLOR,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    left: '50%',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_HALF,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    overflow: 'hidden',
    ...shadowFab,
  },
  fabGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: FAB_HALF,
  },
  fabRing: {
    position: 'absolute',
    width: FAB_SIZE - 8,
    height: FAB_SIZE - 8,
    borderRadius: (FAB_SIZE - 8) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  fabPlusWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPlusBarH: {
    position: 'absolute',
    width: 24,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  fabPlusBarV: {
    position: 'absolute',
    width: 5,
    height: 24,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});
