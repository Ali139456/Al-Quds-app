import { router } from 'expo-router';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { CategoryGradients } from '@/constants/Gradients';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const gradients = CategoryGradients[colorScheme ?? 'light'];
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={[styles.guestContainer, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.accent + '25', gradients.pasta[0] + '20']}
          style={styles.guestHero}
        >
          <Logo size={80} />
        </LinearGradient>
        <Text style={[styles.guestTitle, { color: colors.text }]}>Welcome to Al-Quds</Text>
        <Text style={[styles.guestSubtitle, { color: colors.muted }]}>
          Login to track orders, save addresses, and enjoy faster checkout.
        </Text>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.primaryButtonText}>Login</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => router.push('/auth/register')}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Create account</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[gradients.burgers[0] + '30', gradients.pasta[1] + '20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.profileCard, { borderColor: colors.border }]}
      >
        <View style={[styles.avatarWrap, { backgroundColor: colors.accentMuted }]}>
          <Logo size={48} variant="square" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
          <Text style={[styles.email, { color: colors.muted }]}>{user.email}</Text>
          {user.phone ? <Text style={[styles.phone, { color: colors.muted }]}>{user.phone}</Text> : null}
        </View>
      </LinearGradient>

      <Pressable
        style={[styles.menuRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/addresses')}
      >
        <View style={[styles.menuIcon, { backgroundColor: colors.accentMuted }]}>
          <FontAwesome name="map-marker" size={18} color={colors.accent} />
        </View>
        <Text style={[styles.menuRowText, { color: colors.text }]}>Saved addresses</Text>
        <FontAwesome name="chevron-right" size={14} color={colors.muted} />
      </Pressable>

      <Pressable
        style={[styles.menuRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/orders')}
      >
        <View style={[styles.menuIcon, { backgroundColor: colors.accentMuted }]}>
          <FontAwesome name="motorcycle" size={18} color={colors.accent} />
        </View>
        <Text style={[styles.menuRowText, { color: colors.text }]}>My orders</Text>
        <FontAwesome name="chevron-right" size={14} color={colors.muted} />
      </Pressable>

      <Pressable
        style={[styles.menuRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/help')}
      >
        <View style={[styles.menuIcon, { backgroundColor: colors.accentMuted }]}>
          <FontAwesome name="question-circle" size={18} color={colors.accent} />
        </View>
        <Text style={[styles.menuRowText, { color: colors.text }]}>Help & FAQ</Text>
        <FontAwesome name="chevron-right" size={14} color={colors.muted} />
      </Pressable>

      <Pressable
        style={[styles.logoutButton, { borderColor: colors.danger + '40', backgroundColor: colors.danger + '10' }]}
        onPress={() => logout().then(() => router.replace('/(tabs)/'))}
      >
        <FontAwesome name="sign-out" size={16} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  guestHero: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  guestTitle: { ...Typography.h1, marginBottom: Spacing.sm, textAlign: 'center' },
  guestSubtitle: { ...Typography.bodySm, textAlign: 'center', marginBottom: Spacing.xxl },
  primaryButton: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryButtonText: { color: '#fff', ...Typography.button, fontSize: 16 },
  secondaryButton: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: { ...Typography.button },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileInfo: { marginLeft: Spacing.md, flex: 1 },
  name: { ...Typography.h3 },
  email: { ...Typography.bodySm, marginTop: 2 },
  phone: { ...Typography.bodySm },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowText: { flex: 1, fontWeight: '600', fontSize: 15 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  logoutText: { fontWeight: '700', fontSize: 15 },
});
