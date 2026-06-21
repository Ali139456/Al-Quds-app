import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useOrderHistory } from '@/contexts/OrderHistoryContext';
import { formatPKR } from '@/constants/currency';
import { API_BASE_URL } from '@/constants/api';
import { toast } from '@/contexts/ToastContext';
import { Radius, Spacing } from '@/constants/Spacing';

type Tab = 'rate' | 'give' | 'history';

const TABS: { key: Tab; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { key: 'rate', label: 'Rate order', icon: 'star' },
  { key: 'give', label: 'Give feedback', icon: 'comment-o' },
  { key: 'history', label: 'My ratings', icon: 'list-alt' },
];

function StarRow({ value, onChange, size = 28 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange?.(n)} disabled={!onChange}>
          <FontAwesome name={n <= value ? 'star' : 'star-o'} size={size} color={colors.accent} />
        </Pressable>
      ))}
    </View>
  );
}

export default function FeedbackScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const activeTab: Tab = tab === 'give' || tab === 'history' ? tab : 'rate';
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { orders } = useOrderHistory();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const unratedOrders = useMemo(
    () => orders.filter((o) => o.status === 'delivered' && !o.rating),
    [orders]
  );
  const ratedOrders = useMemo(
    () => orders.filter((o) => o.rating != null && o.rating > 0),
    [orders]
  );

  const switchTab = (next: Tab) => {
    router.setParams({ tab: next });
  };

  const handleSubmitFeedback = async () => {
    if (!rating) {
      toast.warning('Please select a star rating.', 'Feedback');
      return;
    }
    setSubmitting(true);
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating,
            comment: comment.trim() || undefined,
            userId: user?.id,
            email: user?.email,
          }),
        });
        if (!res.ok) throw new Error('Failed');
      }
      toast.success('Thank you for your feedback!', 'Submitted');
      setRating(0);
      setComment('');
    } catch (_) {
      toast.error('Could not submit feedback. Try again.', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.page }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Ratings & Feedbacks</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Rate your orders or share your experience with {user?.name ? `${user.name}` : 'us'}.
      </Text>

      <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <Pressable
              key={t.key}
              style={[styles.tabBtn, active && { backgroundColor: colors.accentMuted }]}
              onPress={() => switchTab(t.key)}
            >
              <FontAwesome name={t.icon} size={13} color={active ? colors.accent : colors.muted} />
              <Text style={[styles.tabLabel, { color: active ? colors.text : colors.muted }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'rate' ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Orders waiting for rating</Text>
          {unratedOrders.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FontAwesome name="check-circle" size={32} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>
                No delivered orders need a rating right now.
              </Text>
            </View>
          ) : (
            unratedOrders.map((order) => (
              <Pressable
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/order/${order.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderId, { color: colors.text }]}>
                    Order {order.id.replace('order_', '#')}
                  </Text>
                  <Text style={[styles.orderMeta, { color: colors.muted }]}>
                    {new Date(order.createdAt).toLocaleDateString()} · {formatPKR(order.total)}
                  </Text>
                  <Text style={[styles.orderAddr, { color: colors.muted }]} numberOfLines={1}>
                    {order.addressLabel}
                  </Text>
                </View>
                <View style={[styles.rateChip, { backgroundColor: colors.accentMuted }]}>
                  <FontAwesome name="star" size={12} color={colors.accent} />
                  <Text style={[styles.rateChipText, { color: colors.accent }]}>Rate</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      {activeTab === 'give' ? (
        <View style={[styles.giveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How was your experience?</Text>
          <Text style={[styles.giveHint, { color: colors.muted }]}>
            Your feedback helps us improve food quality, delivery, and service.
          </Text>
          <StarRow value={rating} onChange={setRating} />
          <TextInput
            style={[styles.commentInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.page }]}
            placeholder="Tell us what you loved or what we can do better..."
            placeholderTextColor={colors.muted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Pressable
            style={[styles.submitBtn, { backgroundColor: colors.accent, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSubmitFeedback}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit feedback'}</Text>
          </Pressable>
        </View>
      ) : null}

      {activeTab === 'history' ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your past ratings</Text>
          {ratedOrders.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FontAwesome name="star-o" size={32} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No ratings yet</Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>
                Rate a delivered order to see it here.
              </Text>
            </View>
          ) : (
            ratedOrders.map((order) => (
              <Pressable
                key={order.id}
                style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/order/${order.id}`)}
              >
                <View style={styles.historyTop}>
                  <Text style={[styles.orderId, { color: colors.text }]}>
                    Order {order.id.replace('order_', '#')}
                  </Text>
                  <Text style={[styles.orderMeta, { color: colors.muted }]}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <StarRow value={order.rating ?? 0} size={18} />
                {order.ratingComment ? (
                  <Text style={[styles.historyComment, { color: colors.muted }]} numberOfLines={3}>
                    "{order.ratingComment}"
                  </Text>
                ) : null}
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: Spacing.lg },
  tabRow: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 4,
  },
  tabLabel: { fontSize: 11, fontWeight: '700' },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: Spacing.xs },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center' },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  orderId: { fontSize: 15, fontWeight: '800' },
  orderMeta: { fontSize: 12, marginTop: 2 },
  orderAddr: { fontSize: 12, marginTop: 2 },
  rateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  rateChipText: { fontSize: 12, fontWeight: '800' },
  giveCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  giveHint: { fontSize: 13, marginBottom: Spacing.xs },
  stars: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.sm },
  commentInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  submitBtn: {
    marginTop: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  submitBtnText: { color: '#0a0a0a', fontWeight: '800', fontSize: 15 },
  historyCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyComment: { fontSize: 13, fontStyle: 'italic', marginTop: 4 },
});
