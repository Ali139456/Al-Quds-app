import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider as NavThemeProvider, type Theme } from '@react-navigation/native';
import Colors from '@/constants/Colors';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { MenuProvider } from '@/contexts/MenuContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AddressProvider } from '@/contexts/AddressContext';
import { DeliveryProvider } from '@/contexts/DeliveryContext';
import { OrderHistoryProvider } from '@/contexts/OrderHistoryContext';
import { PushNotificationsProvider } from '@/contexts/PushNotificationsContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { DealsProvider } from '@/contexts/DealsContext';
import { RiderProvider } from '@/contexts/RiderContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LoyaltyProvider } from '@/contexts/LoyaltyContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { RoleGate } from '@/components/RoleGate';
import PermissionsOnboarding from '@/components/PermissionsOnboarding';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppProviders />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppProviders() {
  return (
    <CartProvider>
      <MenuProvider>
        <DealsProvider>
        <AuthProvider>
          <SettingsProvider>
            <FavoritesProvider>
              <AddressProvider>
                <DeliveryProvider>
                  <OrderHistoryProvider>
                    <LoyaltyProvider>
                      <PushNotificationsProvider>
                        <NotificationsProvider>
                        <RiderProvider>
                          <RoleGate>
                            <PermissionsOnboarding />
                            <ThemedStack />
                          </RoleGate>
                        </RiderProvider>
                        </NotificationsProvider>
                      </PushNotificationsProvider>
                    </LoyaltyProvider>
                  </OrderHistoryProvider>
                </DeliveryProvider>
              </AddressProvider>
            </FavoritesProvider>
          </SettingsProvider>
        </AuthProvider>
        </DealsProvider>
      </MenuProvider>
    </CartProvider>
  );
}

function buildNavTheme(scheme: 'light' | 'dark'): Theme {
  const c = Colors[scheme];
  return {
    dark: scheme === 'dark',
    colors: {
      primary: c.accent,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.border,
      notification: c.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };
}

function ThemedStack() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const navTheme = buildNavTheme(colorScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const scheme = colorScheme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', scheme);
    document.body.style.backgroundColor = colors.background;
    document.documentElement.style.backgroundColor = colors.background;
  }, [colorScheme, colors.background]);

  const stackScreenOptions = {
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      color: colors.text,
      fontWeight: '700' as const,
    },
    headerShadowVisible: false,
    contentStyle: {
      backgroundColor: colors.background,
    },
    ...Platform.select({
      web: {
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 0,
        },
      },
      default: {},
    }),
  };

  return (
    <NavThemeProvider value={navTheme}>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(rider)" options={{ headerShown: false }} />
        <Stack.Screen
          name="food/[id]"
          options={{
            title: 'Customize',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="deal/[id]"
          options={{
            title: 'Deal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Register' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout', headerBackTitleVisible: false }} />
        <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
        <Stack.Screen name="addresses" options={{ title: 'Saved addresses' }} />
        <Stack.Screen name="add-address" options={{ title: 'Add address' }} />
        <Stack.Screen name="order/[id]" options={{ title: 'Track order' }} />
        <Stack.Screen name="help" options={{ title: 'Help & FAQ' }} />
        <Stack.Screen name="feedback" options={{ title: 'Ratings & Feedbacks' }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Push settings',
          }}
        />
      </Stack>
    </NavThemeProvider>
  );
}
