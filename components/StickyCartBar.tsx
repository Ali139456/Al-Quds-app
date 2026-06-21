import { router } from 'expo-router';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useCart } from '@/contexts/CartContext';
import { formatPKR } from '@/constants/currency';
import { Radius, Spacing } from '@/constants/Spacing';

export const STICKY_FOOTER_SCROLL_PAD = 120;

export default function StickyCartBar() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { totalItems, totalPrice } = useCart();

  if (totalItems === 0) return null;

  const stickyPad = insets.bottom + (Platform.OS === 'web' ? 8 : 0);

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: colors.page, borderTopColor: colors.border, paddingBottom: stickyPad },
      ]}
    >
      <View style={styles.footerTop}>
        <View>
          <Text style={[styles.footerLabel, { color: colors.text }]}>Total (incl. fees)</Text>
          <Text style={[styles.footerSub, { color: colors.muted }]}>{totalItems} items</Text>
        </View>
        <Text style={[styles.footerPrice, { color: colors.cta }]}>{formatPKR(totalPrice)}</Text>
      </View>
      <Pressable style={[styles.ctaBtn, { backgroundColor: colors.cta }]} onPress={() => router.push('/(tabs)/cart')}>
        <Text style={styles.ctaBtnText}>View your cart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    zIndex: 20,
  },
  footerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  footerLabel: { fontSize: 14, fontWeight: '700' },
  footerSub: { fontSize: 11, marginTop: 2 },
  footerPrice: { fontSize: 20, fontWeight: '800' },
  ctaBtn: {
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
