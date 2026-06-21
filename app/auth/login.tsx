import { router } from 'expo-router';
import { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { toast } from '@/contexts/ToastContext';
import { DEMO_ACCOUNTS } from '@/constants/demoAccounts';

type LoginMode = 'email' | 'phone';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { login, sendLoginOtp, loginWithPhone } = useAuth();
  const [mode, setMode] = useState<LoginMode>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const finishLogin = (role?: string) => {
    router.replace(role === 'rider' ? '/(rider)' : '/(tabs)/');
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      finishLogin(result.role);
    } else {
      toast.error(result.error ?? 'Login failed', 'Login failed');
    }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    const result = await sendLoginOtp(phone);
    setSendingOtp(false);
    if (result.ok) {
      setOtpSent(true);
      if (result.demoOtp) {
        toast.info(`Demo OTP: ${result.demoOtp}`, 'OTP sent');
      } else {
        toast.success('OTP sent to your number', 'OTP sent');
      }
    } else {
      toast.error(result.error ?? 'Failed to send OTP', 'OTP');
    }
  };

  const handlePhoneLogin = async () => {
    setLoading(true);
    const result = await loginWithPhone(phone, otp);
    setLoading(false);
    if (result.ok) {
      finishLogin(result.role);
    } else {
      toast.error(result.error ?? 'Login failed', 'Login failed');
    }
  };

  const fillDemo = (type: 'customer' | 'rider') => {
    const acc = DEMO_ACCOUNTS[type];
    setMode(type === 'rider' ? 'phone' : 'email');
    if (type === 'rider') {
      setPhone(acc.phone || '03007654321');
      setOtp('');
      setOtpSent(false);
    } else {
      setEmail(acc.email);
      setPassword(acc.password);
    }
  };

  const switchMode = (next: LoginMode) => {
    setMode(next);
    setOtpSent(false);
    setOtp('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Logo size={80} style={styles.logo} />
      <Text style={[styles.title, { color: colors.text }]}>Login to Al-Quds</Text>

      <View style={styles.modeRow}>
        <Pressable
          style={[
            styles.modeChip,
            { borderColor: colors.border, backgroundColor: mode === 'phone' ? colors.accent + '22' : colors.card },
          ]}
          onPress={() => switchMode('phone')}
        >
          <Text style={[styles.modeChipText, { color: mode === 'phone' ? colors.accent : colors.text }]}>Phone + OTP</Text>
        </Pressable>
        <Pressable
          style={[
            styles.modeChip,
            { borderColor: colors.border, backgroundColor: mode === 'email' ? colors.accent + '22' : colors.card },
          ]}
          onPress={() => switchMode('email')}
        >
          <Text style={[styles.modeChipText, { color: mode === 'email' ? colors.accent : colors.text }]}>Email</Text>
        </Pressable>
      </View>

      {mode === 'phone' ? (
        <>
          <Text style={[styles.hint, { color: colors.muted }]}>Riders log in with admin-verified phone number</Text>
          <View style={styles.demoRow}>
            <Pressable
              style={[styles.demoChip, { backgroundColor: colors.accent + '18', borderColor: colors.accent }]}
              onPress={() => fillDemo('rider')}
            >
              <Text style={[styles.demoChipText, { color: colors.text }]}>Demo Rider</Text>
              <Text style={[styles.demoEmail, { color: colors.muted }]}>03007654321</Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Phone (e.g. 03001234567)"
            placeholderTextColor={colors.muted}
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              setOtpSent(false);
            }}
            keyboardType="phone-pad"
          />
          {otpSent ? (
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="6-digit OTP"
              placeholderTextColor={colors.muted}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          ) : null}
          <Pressable
            style={[styles.button, { backgroundColor: colors.accent, opacity: sendingOtp ? 0.7 : 1 }]}
            onPress={otpSent ? handlePhoneLogin : handleSendOtp}
            disabled={loading || sendingOtp}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging in…' : sendingOtp ? 'Sending…' : otpSent ? 'Login' : 'Send OTP'}
            </Text>
          </Pressable>
          {otpSent ? (
            <Pressable onPress={handleSendOtp} disabled={sendingOtp}>
              <Text style={[styles.link, { color: colors.muted }]}>Resend OTP</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <>
          <Text style={[styles.hint, { color: colors.muted }]}>Demo accounts (password: 123456)</Text>
          <View style={styles.demoRow}>
            <Pressable
              style={[styles.demoChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => fillDemo('customer')}
            >
              <Text style={[styles.demoChipText, { color: colors.text }]}>Customer</Text>
              <Text style={[styles.demoEmail, { color: colors.muted }]}>{DEMO_ACCOUNTS.customer.email}</Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Logging in…' : 'Login'}</Text>
          </Pressable>
        </>
      )}

      <Pressable onPress={() => router.push('/auth/register')}>
        <Text style={[styles.link, { color: colors.accent }]}>Create an account</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: { alignSelf: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  hint: { fontSize: 12, textAlign: 'center', marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modeChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeChipText: { fontSize: 13, fontWeight: '700' },
  demoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  demoChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  demoChipText: { fontSize: 13, fontWeight: '700' },
  demoEmail: { fontSize: 10, marginTop: 2 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { marginTop: 20, textAlign: 'center', fontWeight: '600' },
});
