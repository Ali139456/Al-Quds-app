import { router } from 'expo-router';
import { useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useRider } from '@/contexts/RiderContext';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import RiderScreenHeader from '@/components/rider/RiderScreenHeader';
import RiderOrderCard from '@/components/rider/RiderOrderCard';
import RiderCompletedSection from '@/components/rider/RiderCompletedSection';

function StatPill({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: number;
  color: string;
  colors: (typeof Colors)['dark'];
}) {
  return (
    <View style={[styles.statPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  count,
  icon,
  colors,
}: {
  title: string;
  count: number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  colors: (typeof Colors)['dark'];
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.accentMuted }]}>
        <FontAwesome name={icon} size={14} color={colors.accent} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {count > 0 ? (
        <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function EmptyBlock({ message, icon, colors }: { message: string; icon: string; colors: (typeof Colors)['dark'] }) {
  return (
    <View style={[styles.emptyBlock, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={[styles.emptyText, { color: colors.muted }]}>{message}</Text>
    </View>
  );
}

export default function RiderDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user, logout } = useAuth();
  const { available, active, completedCount, isLoading, refresh, unreadCount, fetchCompletedOrders } =
    useRider();

  const onRefresh = useCallback(() => refresh(), [refresh]);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const firstName = user?.name?.split(' ')[0] || 'Rider';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RiderScreenHeader
        title="Rider Hub"
        subtitle={`Hey ${firstName} · GPS tracking on`}
        onLogout={handleLogout}
        badgeCount={unreadCount}
        online
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <LinearGradient
          colors={[colors.accent + '30', colors.accent + '08']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderColor: colors.accent + '35' }]}
        >
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {available.length > 0 ? 'New delivery assigned' : 'Waiting for assignments'}
            </Text>
            <Text style={[styles.heroSub, { color: colors.muted }]}>
              {available.length > 0
                ? `${available.length} order${available.length > 1 ? 's' : ''} assigned by admin`
                : 'Admin will assign orders to you — pull to refresh'}
            </Text>
          </View>
          <View style={[styles.heroOrb, { backgroundColor: colors.accent + '25' }]}>
            <FontAwesome name="bell" size={22} color={colors.accent} />
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatPill label="Assigned" value={available.length} color="#F59E0B" colors={colors} />
          <StatPill label="Active" value={active.length} color="#60A5FA" colors={colors} />
          <StatPill label="Done" value={completedCount} color="#4ADE80" colors={colors} />
        </View>

        <SectionHeader title="Assigned orders" count={available.length} icon="inbox" colors={colors} />
        {available.length === 0 ? (
          <EmptyBlock message="No assigned orders yet. Admin will assign deliveries to you." icon="📭" colors={colors} />
        ) : (
          available.map((order) => (
            <RiderOrderCard
              key={order.id}
              order={order}
              colors={colors}
              onPress={() => router.push(`/(rider)/delivery/${order.id}`)}
            />
          ))
        )}

        <SectionHeader title="Out for delivery" count={active.length} icon="motorcycle" colors={colors} />
        {active.length === 0 ? (
          <EmptyBlock message="No deliveries in progress" icon="🛵" colors={colors} />
        ) : (
          active.map((order) => (
            <RiderOrderCard
              key={order.id}
              order={order}
              colors={colors}
              variant="active"
              onPress={() => router.push(`/(rider)/delivery/${order.id}`)}
            />
          ))
        )}

        <RiderCompletedSection
          colors={colors}
          totalCount={completedCount}
          fetchCompleted={fetchCompletedOrders}
          onOrderPress={(orderId) => router.push(`/(rider)/delivery/${orderId}`)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 48 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  heroContent: { flex: 1 },
  heroTitle: { ...Typography.h2 },
  heroSub: { ...Typography.bodySm, marginTop: 4 },
  heroOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { ...Typography.caption, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { ...Typography.h3, flex: 1 },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: { color: '#1a1a1a', fontSize: 11, fontWeight: '800' },
  emptyBlock: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  emptyIcon: { fontSize: 28, marginBottom: Spacing.sm },
  emptyText: { ...Typography.bodySm, textAlign: 'center' },
});
