import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Logo from '@/components/Logo';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import { Radius, Spacing } from '@/constants/Spacing';
import { shadowSm } from '@/constants/shadows';
import { resolveFoodImageUri } from '@/utils/resolveFoodImage';

type EditField = 'name' | 'email' | 'dateOfBirth' | 'phone';

const FIELD_META: Record<EditField, { label: string; placeholder: string; keyboard?: 'email-address' | 'phone-pad' | 'default' }> = {
  name: { label: 'Full Name', placeholder: 'Your full name' },
  email: { label: 'Email', placeholder: 'you@email.com', keyboard: 'email-address' },
  dateOfBirth: { label: 'Date Of Birth', placeholder: 'e.g. 17-Mar-1998' },
  phone: { label: 'Mobile Number', placeholder: '03123456789', keyboard: 'phone-pad' },
};

function formatPhone(phone?: string) {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('92')) return `+${digits}`;
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`;
  return phone;
}

function ProfileFieldCard({
  label,
  value,
  onEdit,
  badge,
  colors,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  badge?: string;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }, shadowSm]}>
      <View style={styles.fieldHeader}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={[styles.editBtn, { color: colors.accent }]}>EDIT</Text>
        </Pressable>
      </View>
      <View style={styles.fieldValueRow}>
        <Text style={[styles.fieldValue, { color: colors.textSecondary }]}>{value}</Text>
        {badge ? (
          <View style={[styles.verifiedBadge, { backgroundColor: colors.accentMuted }]}>
            <Text style={[styles.verifiedText, { color: colors.accent }]}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { user, isLoading, updateProfile, deleteAccount } = useAuth();
  const [editField, setEditField] = useState<EditField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const heroImage = resolveFoodImageUri('/uploads/menu/categories/burgers.jpg');

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [isLoading, user]);

  if (!user) return null;

  const openEdit = (field: EditField) => {
    setEditField(field);
    if (field === 'name') setEditValue(user.name);
    else if (field === 'email') setEditValue(user.email);
    else if (field === 'dateOfBirth') setEditValue(user.dateOfBirth ?? '');
    else setEditValue(user.phone ?? '');
  };

  const closeEdit = () => {
    setEditField(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editField) return;
    setSaving(true);
    const result = await updateProfile({ [editField]: editValue });
    setSaving(false);
    if (result.ok) {
      toast.success('Profile updated');
      closeEdit();
    } else {
      toast.error(result.error ?? 'Could not save');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete account',
      'This removes your profile from this device. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            router.replace('/(tabs)/');
            toast.info('Account removed from this device');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        {heroImage ? (
          <ImageBackground source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover">
            <LinearGradient
              colors={['rgba(13,15,20,0.35)', 'rgba(13,15,20,0.82)']}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientEnd, colors.background]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[styles.heroNav, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.card + 'CC' }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <FontAwesome name="arrow-left" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.heroTitle}>Profile</Text>
          <View style={styles.backBtnSpacer} />
        </View>
      </View>

      <View style={styles.avatarWrap}>
        <View style={[styles.avatarRing, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Logo size={72} />
          <Pressable
            style={[styles.cameraBtn, { backgroundColor: colors.accent }]}
            onPress={() => toast.info('Profile photo upload coming soon')}
          >
            <FontAwesome name="camera" size={14} color="#0a0a0a" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ProfileFieldCard
          label="Full Name"
          value={user.name}
          onEdit={() => openEdit('name')}
          colors={colors}
        />
        <ProfileFieldCard
          label="Email"
          value={user.email}
          onEdit={() => openEdit('email')}
          colors={colors}
        />
        <ProfileFieldCard
          label="Date Of Birth"
          value={user.dateOfBirth || '—'}
          onEdit={() => openEdit('dateOfBirth')}
          colors={colors}
        />
        <ProfileFieldCard
          label="Mobile Number"
          value={formatPhone(user.phone)}
          onEdit={() => openEdit('phone')}
          badge={user.phone ? 'VERIFIED' : undefined}
          colors={colors}
        />

        <Pressable
          style={[styles.deleteBtn, { borderColor: colors.accent, backgroundColor: colors.card }]}
          onPress={confirmDelete}
        >
          <Text style={[styles.deleteBtnText, { color: colors.accent }]}>DELETE MY ACCOUNT</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={editField !== null} transparent animationType="fade" onRequestClose={closeEdit}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeEdit} />
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit {editField ? FIELD_META[editField].label : ''}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={editField ? FIELD_META[editField].placeholder : ''}
              placeholderTextColor={colors.muted}
              keyboardType={editField ? FIELD_META[editField].keyboard : 'default'}
              autoCapitalize={editField === 'email' ? 'none' : 'sentences'}
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalCancel, { borderColor: colors.border }]} onPress={closeEdit}>
                <Text style={{ color: colors.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSave, { backgroundColor: colors.accent, opacity: saving ? 0.7 : 1 }]}
                onPress={saveEdit}
                disabled={saving}
              >
                <Text style={styles.modalSaveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    height: 200,
    position: 'relative',
    overflow: 'visible',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    zIndex: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnSpacer: { width: 40 },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FAFAF9',
    letterSpacing: 0.2,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: -44,
    marginBottom: Spacing.lg,
    zIndex: 3,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraBtn: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  fieldCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  editBtn: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  fieldValue: {
    fontSize: 14,
    flex: 1,
  },
  verifiedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  deleteBtn: {
    marginTop: Spacing.lg,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#0a0a0a',
    fontWeight: '800',
  },
});
