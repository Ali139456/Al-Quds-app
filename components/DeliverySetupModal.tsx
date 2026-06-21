import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useDelivery } from '@/contexts/DeliveryContext';
import DeliveryLocationPicker from '@/components/DeliveryLocationPicker';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { shadowLg } from '@/constants/shadows';

export default function DeliverySetupModal() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const { showSetupModal, saveDeliverySetup, dismissSetupModal } = useDelivery();

  const popupWidth = Math.min(width - Spacing.lg * 2, 420);

  return (
    <Modal visible={showSetupModal} animationType="fade" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={dismissSetupModal} accessibilityLabel="Close" />

        <View
          style={[
            styles.popup,
            shadowLg,
            {
              width: popupWidth,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>Delivery location</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>Rawalpindi only</Text>
            </View>
            <Pressable onPress={dismissSetupModal} hitSlop={12} style={styles.closeBtn}>
              <FontAwesome name="times" size={18} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <DeliveryLocationPicker />
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              onPress={() => void saveDeliverySetup()}
            >
              <Text style={styles.saveBtnText}>Confirm location</Text>
              <FontAwesome name="check" size={14} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      } as object,
      default: {},
    }),
  },
  popup: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { ...Typography.h3, marginBottom: 2 },
  subtitle: { ...Typography.caption, lineHeight: 16 },
  closeBtn: { padding: Spacing.xs, marginTop: -2 },
  body: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  saveBtnText: { color: '#fff', ...Typography.button, fontSize: 15 },
});
