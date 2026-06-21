import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

function formatWhen(iso: string) {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { notifications, unreadCount, isLoading, refreshNotifications, markRead, markAllRead } =
    useNotifications();

  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <FontAwesome name="bell-o" size={40} color={colors.muted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Sign in to see notifications</Text>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.primaryBtnText}>Log in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.toolbarHint, { color: colors.muted }]}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </Text>
        <View style={styles.toolbarActions}>
          <Pressable
            onPress={() => router.push('/modal')}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.link, { color: colors.accent }]}>Push settings</Text>
          </Pressable>
          {unreadCount > 0 ? (
            <Pressable onPress={markAllRead} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.link, { color: colors.accent }]}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <FontAwesome name="bell-slash-o" size={40} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
          <Text style={[styles.emptySub, { color: colors.muted }]}>
            Order updates and deals will show up here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {notifications.map((item) => (
            <Pressable
              key={item.id}
              style={[
                styles.row,
                {
                  backgroundColor: item.read ? colors.background : colors.accentMuted,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                if (!item.read) markRead(item.id);
              }}
            >
              <View style={styles.rowTop}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
                {!item.read ? (
                  <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
                ) : null}
              </View>
              <Text style={[styles.rowBody, { color: colors.muted }]}>{item.body}</Text>
              <Text style={[styles.rowTime, { color: colors.muted }]}>{formatWhen(item.created_at)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbarHint: { ...Typography.caption },
  toolbarActions: { flexDirection: 'row', gap: Spacing.md },
  link: { fontSize: 14, fontWeight: '600' },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  row: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: 4,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: Spacing.sm },
  rowBody: { fontSize: 14, lineHeight: 20 },
  rowTime: { fontSize: 12, marginTop: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: Spacing.md },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});
