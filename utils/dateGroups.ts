function parseOrderDate(dateInput: string): Date {
  const s = dateInput.trim();
  if (s.includes('T')) return new Date(s);
  return new Date(s.replace(' ', 'T'));
}

/** Local calendar date key: YYYY-MM-DD */
export function toDateKey(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? parseOrderDate(dateInput) : dateInput;
  const local = new Date(d.getTime());
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, '0');
  const day = String(local.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return toDateKey(new Date());
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateKey(d);
}

/** Human label: Today, Yesterday, or e.g. "Mon, 9 Jun 2026" */
export function formatDateGroupLabel(dateKey: string): string {
  const today = todayKey();
  const yesterday = yesterdayKey();
  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';

  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export type DateGroup<T> = {
  key: string;
  label: string;
  items: T[];
};

export function groupItemsByDate<T>(
  items: T[],
  getDate: (item: T) => string
): DateGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = toDateKey(getDate(item));
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, grouped]) => ({
      key,
      label: formatDateGroupLabel(key),
      items: grouped,
    }));
}

/** Short date on order cards: "Today, 3:45 PM" or "Yesterday" or "9 Jun 2026" */
export function formatOrderDateTime(dateInput: string): string {
  const key = toDateKey(dateInput);
  const d = parseOrderDate(dateInput);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (key === todayKey()) return `Today, ${time}`;
  if (key === yesterdayKey()) return `Yesterday, ${time}`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
