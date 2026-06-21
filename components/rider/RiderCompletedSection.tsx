import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import type { RiderOrder } from '@/types';
import RiderOrderCard from '@/components/rider/RiderOrderCard';
import { groupItemsByDate, toDateKey } from '@/utils/dateGroups';

type Colors = {
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  surfaceElevated: string;
};

type DateFilter = 'all' | 'today' | 'yesterday' | 'custom';

type FetchCompleted = (params: {
  search?: string;
  date?: string;
  page?: number;
  limit?: number;
}) => Promise<{
  items: RiderOrder[];
  total: number;
  page: number;
  totalPages: number;
}>;

const PAGE_SIZE = 5;

function recentDateKeys(days = 14): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = 0; i < days; i++) {
    keys.push(toDateKey(d));
    d.setDate(d.getDate() - 1);
  }
  return keys;
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
  colors: Colors;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.accent + '22' }]}>
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

export default function RiderCompletedSection({
  colors,
  totalCount,
  fetchCompleted,
  onOrderPress,
}: {
  colors: Colors;
  totalCount: number;
  fetchCompleted: FetchCompleted;
  onOrderPress: (orderId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDate, setCustomDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<RiderOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateKey(d);
  }, []);

  const selectedDate = useMemo(() => {
    if (dateFilter === 'today') return todayKey;
    if (dateFilter === 'yesterday') return yesterdayKey;
    if (dateFilter === 'custom' && /^\d{4}-\d{2}-\d{2}$/.test(customDate)) return customDate;
    return undefined;
  }, [dateFilter, customDate, todayKey, yesterdayKey]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedDate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCompleted({
        search: debouncedSearch || undefined,
        date: selectedDate,
        page,
        limit: PAGE_SIZE,
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (_) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [fetchCompleted, debouncedSearch, selectedDate, page]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => groupItemsByDate(items, (o) => o.created_at), [items]);

  const setFilter = (next: DateFilter, date?: string) => {
    setDateFilter(next);
    if (next === 'custom' && date) setCustomDate(date);
    if (next !== 'custom') setCustomDate('');
    setShowDatePicker(false);
  };

  if (totalCount === 0 && !debouncedSearch && !selectedDate) return null;

  return (
    <View>
      <SectionHeader title="Completed" count={totalCount} icon="check-circle" colors={colors} />

      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <FontAwesome name="search" size={14} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search order #, name, phone, address…"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <FontAwesome name="times-circle" size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {(['all', 'today', 'yesterday'] as const).map((key) => {
          const active = dateFilter === key;
          const label = key === 'all' ? 'All dates' : key === 'today' ? 'Today' : 'Yesterday';
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.accent + '22' : colors.surfaceElevated,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterChipText, { color: active ? colors.accent : colors.text }]}>{label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setShowDatePicker((v) => !v)}
          style={[
            styles.filterChip,
            {
              backgroundColor: dateFilter === 'custom' ? colors.accent + '22' : colors.surfaceElevated,
              borderColor: dateFilter === 'custom' ? colors.accent : colors.border,
            },
          ]}
        >
          <FontAwesome name="calendar" size={12} color={dateFilter === 'custom' ? colors.accent : colors.muted} />
          <Text style={[styles.filterChipText, { color: dateFilter === 'custom' ? colors.accent : colors.text }]}>
            {dateFilter === 'custom' && customDate ? customDate : 'Date'}
          </Text>
        </Pressable>
      </View>

      {showDatePicker ? (
        <View style={[styles.datePickerPanel, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {recentDateKeys().map((key) => (
            <Pressable
              key={key}
              onPress={() => setFilter('custom', key)}
              style={[
                styles.dateOption,
                {
                  backgroundColor: customDate === key && dateFilter === 'custom' ? colors.accent + '18' : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text, fontSize: 13 }}>{key}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: Spacing.lg }} />
      ) : items.length === 0 ? (
        <View style={[styles.emptyBlock, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No completed orders match your filters.</Text>
        </View>
      ) : (
        <>
          {grouped.map((group) => (
            <View key={group.key}>
              <Text style={[styles.dateLabel, { color: colors.muted }]}>
                {group.label} · {group.items.length} order{group.items.length > 1 ? 's' : ''}
              </Text>
              {group.items.map((order) => (
                <RiderOrderCard
                  key={order.id}
                  order={order}
                  colors={colors}
                  variant="completed"
                  onPress={() => onOrderPress(order.id)}
                />
              ))}
            </View>
          ))}

          {totalPages > 1 ? (
            <View style={[styles.pagination, { borderColor: colors.border }]}>
              <Pressable
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                style={[styles.pageBtn, { opacity: page <= 1 ? 0.4 : 1, borderColor: colors.border }]}
              >
                <FontAwesome name="chevron-left" size={12} color={colors.text} />
                <Text style={[styles.pageBtnText, { color: colors.text }]}>Prev</Text>
              </Pressable>
              <Text style={[styles.pageInfo, { color: colors.muted }]}>
                Page {page} of {totalPages} · {total} total
              </Text>
              <Pressable
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                style={[styles.pageBtn, { opacity: page >= totalPages ? 0.4 : 1, borderColor: colors.border }]}
              >
                <Text style={[styles.pageBtnText, { color: colors.text }]}>Next</Text>
                <FontAwesome name="chevron-right" size={12} color={colors.text} />
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  datePickerPanel: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  dateOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  dateLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
    textTransform: 'none',
    letterSpacing: 0,
  },
  emptyBlock: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  emptyText: { ...Typography.bodySm, textAlign: 'center' },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  pageBtnText: { fontSize: 13, fontWeight: '600' },
  pageInfo: { ...Typography.caption, textAlign: 'center', flex: 1 },
});
