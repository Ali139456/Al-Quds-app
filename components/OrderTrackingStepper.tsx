import { View, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import type { OrderStatus } from '@/types';
import { Spacing } from '@/constants/Spacing';

const STEPS: { key: OrderStatus; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { key: 'placed', label: 'Placed', icon: 'check-circle' },
  { key: 'confirmed', label: 'Confirmed', icon: 'thumbs-up' },
  { key: 'preparing', label: 'Preparing', icon: 'fire' },
  { key: 'out_for_delivery', label: 'On the way', icon: 'motorcycle' },
  { key: 'delivered', label: 'Delivered', icon: 'smile-o' },
];

const ORDER: OrderStatus[] = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

type Props = { status: OrderStatus };

export default function OrderTrackingStepper({ status }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentIdx = ORDER.indexOf(status);

  return (
    <View style={styles.wrap}>
      {STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <View key={step.key} style={styles.step}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: done ? colors.accent : colors.borderLight,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <FontAwesome name={step.icon} size={12} color={done ? '#fff' : colors.muted} />
            </View>
            <Text style={[styles.label, { color: active ? colors.text : colors.muted }]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md },
  step: { alignItems: 'center', flex: 1 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
});
