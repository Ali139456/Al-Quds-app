import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Spacing } from '@/constants/Spacing';

type Step = 1 | 2 | 3;

const STEPS = [
  { n: 1, label: 'Menu' },
  { n: 2, label: 'Cart' },
  { n: 3, label: 'Checkout' },
] as const;

type Props = {
  current: Step;
};

export default function OrderStepBar({ current }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.wrap}>
      {STEPS.map((step, index) => {
        const active = step.n === current;
        const done = step.n < current;
        const circleBg = active || done ? colors.text : colors.border;
        const circleColor = active || done ? colors.page : colors.muted;
        return (
          <View key={step.n} style={styles.stepWrap}>
            <View style={styles.stepRow}>
              {index > 0 && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: step.n <= current ? colors.text : colors.border },
                  ]}
                />
              )}
              <View style={[styles.circle, { backgroundColor: circleBg }]}>
                <Text style={[styles.circleText, { color: circleColor }]}>{step.n}</Text>
              </View>
              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: step.n < current ? colors.text : colors.border },
                  ]}
                />
              )}
            </View>
            <Text style={[styles.label, { color: active ? colors.text : colors.muted }]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  stepWrap: { flex: 1, alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  line: { flex: 1, height: 2, maxWidth: 48 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: { fontSize: 13, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '600', marginTop: 6 },
});
