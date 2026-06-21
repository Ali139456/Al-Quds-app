import { router } from 'expo-router';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import Logo from '@/components/Logo';

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onLogout?: () => void;
  badgeCount?: number;
  online?: boolean;
};

export default function RiderScreenHeader({
  title,
  subtitle,
  showBack,
  onLogout,
  badgeCount = 0,
  online = true,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <LinearGradient
      colors={[colors.headerGradientStart, colors.headerGradientEnd]}
      style={[styles.wrap, { borderBottomColor: colors.border }]}
    >
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
            hitSlop={8}
          >
            <FontAwesome name="chevron-left" size={14} color={colors.text} />
          </Pressable>
        ) : (
          <Logo size={28} />
        )}

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {online ? (
            <View style={[styles.onlinePill, { backgroundColor: colors.success + '22', borderColor: colors.success + '44' }]}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.onlineText, { color: colors.success }]}>Live</Text>
            </View>
          ) : null}
          {onLogout ? (
            <Pressable
              onPress={onLogout}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <FontAwesome name="sign-out" size={15} color={colors.accent} />
              {badgeCount > 0 ? (
                <View style={styles.notifDot}>
                  <Text style={styles.notifDotText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: Platform.OS === 'web' ? Spacing.lg : Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { ...Typography.h2 },
  subtitle: { ...Typography.bodySm, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifDotText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
