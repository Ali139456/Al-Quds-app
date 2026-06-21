import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, Tabs } from 'expo-router';
import { Pressable, View, StyleSheet, Platform, Text } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import Logo from '@/components/Logo';
import CustomTabBar from '@/components/CustomTabBar';
import AddressPickerSheet from '@/components/AddressPickerSheet';
import SidebarMenu from '@/components/SidebarMenu';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Radius, Spacing } from '@/constants/Spacing';

const SUN_COLOR = '#F5C542';

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <FontAwesome
        name={isDark ? 'sun-o' : 'moon-o'}
        size={20}
        color={isDark ? SUN_COLOR : colors.text}
      />
    </Pressable>
  );
}

function HeaderLeft() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { open } = useSidebar();

  return (
    <View style={styles.headerLeft}>
      <Pressable
        onPress={open}
        style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
        accessibilityLabel="Open menu"
      >
        <FontAwesome name="bars" size={22} color={colors.text} />
      </Pressable>
      <Logo size={32} />
    </View>
  );
}

function HeaderActions() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { totalItems } = useCart();
  const { unreadCount } = useNotifications();
  return (
    <View style={styles.headerActions}>
      <ThemeToggleButton />
      <Pressable
        style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
        accessibilityLabel="Notifications"
        onPress={() => router.push('/notifications')}
      >
        <FontAwesome name="bell-o" size={20} color={colors.text} />
        {unreadCount > 0 ? (
          <View style={[styles.cartBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.cartBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
        accessibilityLabel="Cart"
        onPress={() => router.push('/(tabs)/cart')}
      >
        <FontAwesome name="shopping-cart" size={20} color={colors.text} />
        {totalItems > 0 ? (
          <View style={[styles.cartBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.cartBadgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SidebarProvider>
    <AddressPickerSheet />
    <SidebarMenu />
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarBackground: () => null,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          paddingTop: 0,
          paddingBottom: 0,
          paddingHorizontal: 0,
          marginHorizontal: 0,
          height: undefined,
          overflow: 'visible',
          ...Platform.select({
            web: {},
            default: {
              elevation: 0,
              shadowOpacity: 0,
              shadowColor: 'transparent',
            },
          }),
        },
        headerStyle: {
          backgroundColor: colors.background,
          ...Platform.select({
            web: {},
            default: {
              shadowColor: 'transparent',
              elevation: 0,
            },
          }),
        },
        headerTintColor: colors.text,
        headerTitle: '',
        headerShadowVisible: false,
        headerLeft: () => <HeaderLeft />,
        headerLeftContainerStyle: { paddingLeft: Spacing.sm },
        headerRight: () => <HeaderActions />,
        headerRightContainerStyle: { paddingRight: Spacing.md },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu' }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
    </SidebarProvider>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.lg,
    gap: Spacing.xs,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#0a0a0a',
    fontSize: 10,
    fontWeight: '800',
  },
});
