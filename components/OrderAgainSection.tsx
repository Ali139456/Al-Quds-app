import { useMemo } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useOrderHistory } from '@/contexts/OrderHistoryContext';
import { useMenu } from '@/contexts/MenuContext';
import FoodImage from '@/components/FoodImage';
import { Radius, Spacing } from '@/constants/Spacing';
import { shadowSm } from '@/constants/shadows';

export default function OrderAgainSection() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { orders } = useOrderHistory();
  const { items: menuItems } = useMenu();

  const recentItems = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string; image?: string }[] = [];
    for (const order of orders) {
      for (const item of order.items) {
        if (seen.has(item.foodId)) continue;
        seen.add(item.foodId);
        const menuItem = menuItems.find((m) => m.id === item.foodId);
        result.push({
          id: item.foodId,
          name: menuItem?.name ?? item.name,
          image: menuItem?.image ?? item.image,
        });
        if (result.length >= 8) return result;
      }
    }
    return result;
  }, [orders, menuItems]);

  if (recentItems.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Order again</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>Recently ordered</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {recentItems.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/food/${item.id}`)}
          >
            <View style={[styles.thumb, { backgroundColor: colors.borderLight }]}>
              <FoodImage
                image={item.image}
                style={styles.photo}
                emojiStyle={styles.emoji}
                resizeMode="cover"
              />
            </View>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  sub: {
    fontSize: 12,
    marginTop: 4,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  card: {
    width: 100,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    ...shadowSm,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 32,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 14,
  },
});
