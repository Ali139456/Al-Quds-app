import { StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSettings } from '@/contexts/SettingsContext';
import { BRAND_NAME } from '@/constants/menu';
import { Radius, Spacing } from '@/constants/Spacing';

type Props = {
  compact?: boolean;
};

export default function StoreClosedBanner({ compact }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { settings } = useSettings();

  if (settings.storeOpen) return null;

  return (
    <View
      style={[
        styles.banner,
        compact && styles.bannerCompact,
        { backgroundColor: colors.dangerBg, borderColor: colors.danger },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
        <FontAwesome name="clock-o" size={compact ? 18 : 22} color={colors.danger} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.danger }]}>{BRAND_NAME} is closed</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Please try again later. You can browse the menu, but new orders are paused.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  bannerCompact: {
    marginHorizontal: 0,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
  },
});
