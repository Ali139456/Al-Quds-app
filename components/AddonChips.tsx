import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import type { Addon } from '@/types';
import { isFriesAddon } from '@/constants/addons';
import { formatPKR } from '@/constants/currency';
import { Radius, Spacing } from '@/constants/Spacing';
import Colors from '@/constants/Colors';

type AddonChipsProps = {
  addons: Addon[];
  showPrice?: boolean;
  compact?: boolean;
  colorScheme?: 'light' | 'dark' | null;
};

function addonEmoji(addon: Addon): string {
  return isFriesAddon(addon) ? '🍟' : '🥤';
}

export function addonNamesToList(addonsStr?: string): string[] {
  if (!addonsStr?.trim()) return [];
  return addonsStr.split(',').map((s) => s.trim()).filter(Boolean);
}

export default function AddonChips({ addons, showPrice = false, compact = false, colorScheme }: AddonChipsProps) {
  if (!addons.length) return null;
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={styles.row}>
      {addons.map((addon) => (
        <View
          key={addon.id}
          style={[
            compact ? styles.chipCompact : styles.chip,
            { backgroundColor: colors.accentMuted, borderColor: colors.accent + '55' },
          ]}
        >
          <Text style={[compact ? styles.chipTextCompact : styles.chipText, { color: colors.text }]}>
            {addonEmoji(addon)} {addon.name}
            {showPrice ? ` +${formatPKR(addon.price)}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Chips from comma-separated addon names (order history). */
export function AddonNameChips({
  names,
  colorScheme,
}: {
  names: string[];
  colorScheme?: 'light' | 'dark' | null;
}) {
  if (!names.length) return null;
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={styles.row}>
      {names.map((name) => {
        const fries = /fries/i.test(name);
        return (
          <View
            key={name}
            style={[styles.chip, { backgroundColor: colors.accentMuted, borderColor: colors.accent + '55' }]}
          >
            <Text style={[styles.chipText, { color: colors.text }]}>
              {fries ? '🍟' : '🥤'} {name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipTextCompact: {
    fontSize: 9,
    fontWeight: '600',
  },
});
