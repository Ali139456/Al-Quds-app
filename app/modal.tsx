import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { usePushNotifications } from '@/contexts/PushNotificationsContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Logo from '@/components/Logo';

export default function NotificationsModal() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    expoPushToken,
    permissionStatus,
    isLoading,
    requestPermission,
  } = usePushNotifications();

  const handleEnable = async () => {
    await requestPermission();
    // If still denied after request, user may need to open Settings
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

      <Logo size={56} style={styles.modalLogo} />
      <Text style={[styles.title, { color: colors.text }]}>Order updates & offers</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Get notified when your order is confirmed, out for delivery, or when Al-Quds has special
        offers. Uses Expo Push (FCM on Android, APNs on iOS).
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Status</Text>
        <Text style={[styles.statusText, { color: colors.muted }]}>
          {isLoading
            ? 'Checking…'
            : permissionStatus === 'granted'
              ? 'Notifications enabled'
              : permissionStatus === 'denied'
                ? 'Notifications blocked (enable in Settings)'
                : 'Notifications not enabled yet'}
        </Text>
        {!isLoading && permissionStatus !== 'granted' && (
          <Pressable
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={handleEnable}
          >
            <Text style={styles.buttonText}>Enable notifications</Text>
          </Pressable>
        )}
      </View>

      {expoPushToken && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Push token (for testing)</Text>
          <Text style={[styles.tokenText, { color: colors.muted }]} selectable>
            {expoPushToken}
          </Text>
          <Text style={[styles.hint, { color: colors.muted }]}>
            Use this in the Expo Push Notifications tool (expo.dev/notifications) to send a test.
          </Text>
        </View>
      )}

      {!expoPushToken && permissionStatus === 'granted' && !isLoading && (
        <Text style={[styles.hint, { color: colors.muted }]}>
          Project ID not set. Run "eas init" or add extra.eas.projectId in app.json to get a push
          token. Push still works when you build with EAS.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  modalLogo: { alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  statusText: { fontSize: 15, marginBottom: 12 },
  tokenText: { fontSize: 12, marginBottom: 8 },
  hint: { fontSize: 12, marginTop: 4 },
  button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
