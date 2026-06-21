import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSettings } from '@/contexts/SettingsContext';
import { Radius, Spacing } from '@/constants/Spacing';

const FAQ = [
  { q: 'Where do you deliver?', a: 'We deliver across Rawalpindi only. Set your pin on the map to confirm.' },
  { q: 'What payment methods are accepted?', a: 'Cash on Delivery (COD) and Easypaisa/JazzCash. Send payment screenshot after placing digital payment orders.' },
  { q: 'How do I use a coupon?', a: 'Enter your code at checkout. Valid codes show discount instantly.' },
  { q: 'Can I schedule an order?', a: 'Yes — choose "Schedule for later" at checkout and pick a time.' },
  { q: 'How do loyalty points work?', a: 'Earn points on every order. Redeem them at checkout for discounts.' },
  { q: 'How do I add a second address?', a: 'Account → Saved addresses → Add new address.' },
];

export default function HelpScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { settings } = useSettings();

  const openWhatsApp = () => {
    const msg = encodeURIComponent('Hi Al-Quds, I need help with my order.');
    Linking.openURL(`https://wa.me/92${settings.supportWhatsapp.replace(/^0/, '')}?text=${msg}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.page }]} contentContainerStyle={styles.content}>
      <Pressable style={[styles.supportCard, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]} onPress={openWhatsApp}>
        <FontAwesome name="whatsapp" size={28} color="#25D366" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.supportTitle, { color: colors.text }]}>Chat on WhatsApp</Text>
          <Text style={[styles.supportSub, { color: colors.muted }]}>{settings.supportWhatsapp}</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={colors.muted} />
      </Pressable>

      <Text style={[styles.section, { color: colors.text }]}>FAQ</Text>
      {FAQ.map((item, i) => (
        <View key={i} style={[styles.faq, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.q, { color: colors.text }]}>{item.q}</Text>
          <Text style={[styles.a, { color: colors.muted }]}>{item.a}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  supportTitle: { fontSize: 16, fontWeight: '800' },
  supportSub: { fontSize: 13, marginTop: 2 },
  section: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.md },
  faq: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.sm },
  q: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  a: { fontSize: 13, lineHeight: 18 },
});
