import { router } from 'expo-router';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useDeals } from '@/contexts/DealsContext';
import DealCard from '@/components/DealCard';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Pressable } from 'react-native';

export default function DealsSection() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { deals, isLoading } = useDeals();
  const { width } = useWindowDimensions();

  if (isLoading || deals.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>🔥 Deals & Combos</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Limited offers — save more today</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/menu?category=deals')} hitSlop={8}>
          <Text style={[styles.viewAll, { color: colors.accent }]}>VIEW ALL</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        decelerationRate="fast"
        snapToInterval={260 + Spacing.md}
      >
        {deals.map((deal) => (
          <View key={deal.id} style={{ width: Math.min(260, width * 0.68) }}>
            <DealCard deal={deal} variant="featured" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h2 },
  subtitle: { ...Typography.bodySm, marginTop: 2 },
  viewAll: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
});
