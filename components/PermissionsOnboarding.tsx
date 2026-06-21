import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  Linking,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing } from '@/constants/Spacing';
import Logo from '@/components/Logo';
import {
  getLocationPermissionStatus,
  getPermissionStatus,
  markPermissionsPromptShown,
  requestAllAppPermissions,
  wasPermissionsPromptShown,
} from '@/services/appPermissions';
import { usePushNotifications } from '@/contexts/PushNotificationsContext';

/**
 * First-launch sheet: explains why we need notifications + location,
 * then triggers the native OS permission dialogs (Play Store / production builds).
 */
export default function PermissionsOnboarding() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { refreshToken } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'intro' | 'done'>('intro');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const alreadyShown = await wasPermissionsPromptShown();
      if (alreadyShown) return;
      const notif = await getPermissionStatus();
      const loc = await getLocationPermissionStatus();
      if (notif === 'granted' && loc === 'granted') {
        await markPermissionsPromptShown();
        await refreshToken();
        return;
      }
      setVisible(true);
    })();
  }, [refreshToken]);

  const finish = useCallback(async () => {
    await markPermissionsPromptShown();
    await refreshToken();
    setVisible(false);
  }, [refreshToken]);

  const handleAllow = async () => {
    setBusy(true);
    await requestAllAppPermissions();
    await refreshToken();
    setStep('done');
    setBusy(false);
  };

  const handleSkip = async () => {
    await finish();
  };

  if (Platform.OS === 'web' || !visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Logo size={40} style={styles.logo} />
          <Text style={[styles.title, { color: colors.text }]}>
            {step === 'intro' ? 'Stay updated on your order' : 'You\'re all set'}
          </Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            {step === 'intro'
              ? 'Allow notifications so order updates appear in your phone\'s notification bar — even when the app is closed. Location helps us deliver to the right address in Rawalpindi.'
              : 'You can change these anytime in your phone Settings → Apps → Al-Quds.'}
          </Text>

          {step === 'intro' ? (
            <>
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: colors.accentMuted }]}>
                  <FontAwesome name="bell" size={16} color={colors.accent} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Order confirmed, out for delivery, delivered
                </Text>
              </View>
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: colors.accentMuted }]}>
                  <FontAwesome name="map-marker" size={18} color={colors.accent} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Accurate delivery address on the map
                </Text>
              </View>

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: busy ? 0.7 : 1 }]}
                onPress={handleAllow}
                disabled={busy}
              >
                <Text style={styles.primaryBtnText}>
                  {busy ? 'Opening permissions…' : 'Allow notifications & location'}
                </Text>
              </Pressable>
              <Pressable onPress={handleSkip} style={styles.skipBtn}>
                <Text style={[styles.skipText, { color: colors.muted }]}>Not now</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                onPress={finish}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openSettings()}
                style={styles.skipBtn}
              >
                <Text style={[styles.skipText, { color: colors.accent }]}>Open Settings</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sheet: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  logo: { alignSelf: 'center', marginBottom: Spacing.md },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.sm },
  body: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: Spacing.lg },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 19 },
  primaryBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  skipBtn: { marginTop: Spacing.md, alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 14, fontWeight: '600' },
});
