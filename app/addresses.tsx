import { router } from 'expo-router';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Linking from 'expo-linking';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useAddress } from '@/contexts/AddressContext';
import { getGoogleMapsUrl } from '@/constants/location';
import Logo from '@/components/Logo';
import { toast } from '@/contexts/ToastContext';

export default function AddressesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { addresses, selectedAddress, setSelectedAddress, removeAddress } = useAddress();

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Logo size={80} style={styles.logo} />
        <Text style={[styles.title, { color: colors.text }]}>Saved addresses</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Login to save and manage addresses.</Text>
        <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => router.replace('/auth/login')}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>
      </View>
    );
  }

  const handleRemove = (id: string, label: string) => {
    toast.alert('Remove address', `Remove "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeAddress(id) },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.hint, { color: colors.muted }]}>We deliver only in Rawalpindi. Add your address below.</Text>

      {addresses.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No saved addresses. Add one to get started.</Text>
          <Pressable style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/add-address')}>
            <Text style={styles.addButtonText}>Add address</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {addresses.map((addr) => (
            <View key={addr.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.label, { color: colors.text }]}>{addr.label}</Text>
                {selectedAddress?.id === addr.id && (
                  <View style={[styles.selectedBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.selectedBadgeText}>Selected</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.addressLine, { color: colors.muted }]}>
                {addr.area ? `${addr.area}, ${addr.addressLine}` : addr.addressLine}
              </Text>
              <Text style={[styles.city, { color: colors.muted }]}>{addr.city}</Text>
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                  onPress={() => setSelectedAddress(addr.id)}
                >
                  <FontAwesome name="check" size={14} color={colors.accent} />
                  <Text style={[styles.actionBtnText, { color: colors.accent }]}>Use this</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                  onPress={() => Linking.openURL(getGoogleMapsUrl(addr.latitude, addr.longitude, addr.label))}
                >
                  <FontAwesome name="map" size={14} color={colors.text} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>Open in Maps</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { borderColor: colors.border }]} onPress={() => handleRemove(addr.id, addr.label)}>
                  <FontAwesome name="trash-o" size={14} color="#c53030" />
                  <Text style={[styles.actionBtnText, { color: '#c53030' }]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Pressable style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/add-address')}>
            <Text style={styles.addButtonText}>Add new address</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  logo: { alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginHorizontal: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
  hint: { fontSize: 13, marginBottom: 16 },
  empty: { padding: 24, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  emptyText: { marginBottom: 16 },
  addButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16, fontWeight: '700' },
  selectedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  selectedBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  addressLine: { marginTop: 6 },
  city: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', marginTop: 12, gap: 8, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
});
