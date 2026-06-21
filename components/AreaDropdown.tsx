import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { RAWALPINDI_AREAS, type RawalpindiArea } from '@/constants/rawalpindiAreas';
import { Radius, Spacing } from '@/constants/Spacing';

type Props = {
  value: RawalpindiArea | null;
  onChange: (area: RawalpindiArea) => void;
  placeholder?: string;
};

export default function AreaDropdown({
  value,
  onChange,
  placeholder = 'Select area…',
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        style={[styles.trigger, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.triggerText, { color: value ? colors.text : colors.muted }]}>
          {value?.name ?? placeholder}
        </Text>
        <FontAwesome name="chevron-down" size={14} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Select area (Rawalpindi)</Text>
            <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
              {RAWALPINDI_AREAS.map((area) => {
                const selected = value?.id === area.id;
                return (
                  <Pressable
                    key={area.id}
                    style={[
                      styles.option,
                      { borderBottomColor: colors.border },
                      selected && { backgroundColor: colors.accentMuted },
                    ]}
                    onPress={() => {
                      onChange(area);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, { color: colors.text }]}>{area.name}</Text>
                    {selected && <FontAwesome name="check" size={14} color={colors.accent} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  triggerText: { fontSize: 16, fontWeight: '600', flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    maxHeight: '70%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sheetList: { maxHeight: 360 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 15, fontWeight: '600' },
});
