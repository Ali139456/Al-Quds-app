import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Logo from '@/components/Logo';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { BRAND_NAME } from '@/constants/menu';
import { Radius, Spacing } from '@/constants/Spacing';
import { shadowMd } from '@/constants/shadows';
import Constants from 'expo-constants';

type MenuItem = {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  onPress: () => void;
  danger?: boolean;
};

type SubMenuItem = {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  path: string;
};

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SidebarMenu() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { isOpen, close } = useSidebar();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const [ratingsExpanded, setRatingsExpanded] = useState(false);

  const navigate = (path: string) => {
    close();
    router.push(path as never);
  };

  const openWhatsApp = () => {
    close();
    const msg = encodeURIComponent(`Hi ${BRAND_NAME}, I need help with my order.`);
    Linking.openURL(`https://wa.me/92${settings.supportWhatsapp.replace(/^0/, '')}?text=${msg}`);
  };

  const handleLogout = async () => {
    close();
    await logout();
    router.replace('/(tabs)/');
  };

  const mainMenuItems: MenuItem[] = [
    {
      label: 'My Orders',
      icon: 'motorcycle',
      onPress: () => {
        if (!user) {
          close();
          router.push('/auth/login');
          return;
        }
        navigate('/orders');
      },
    },
    { label: 'My Favorites', icon: 'heart-o', onPress: () => navigate('/(tabs)/menu?filter=favorites') },
    { label: 'Explore Menu', icon: 'th-large', onPress: () => navigate('/(tabs)/menu') },
    { label: 'Saved Addresses', icon: 'map-marker', onPress: () => navigate('/addresses') },
    { label: 'Notifications', icon: 'bell-o', onPress: () => navigate('/notifications') },
  ];

  const ratingsSubItems: SubMenuItem[] = [
    { label: 'Rate an order', icon: 'star', path: '/feedback?tab=rate' },
    { label: 'Give feedback', icon: 'comment-o', path: '/feedback?tab=give' },
    { label: 'My ratings', icon: 'list-alt', path: '/feedback?tab=history' },
  ];

  const navigateSubItem = (path: string) => {
    if (!user) {
      close();
      router.push('/auth/login');
      return;
    }
    navigate(path);
  };

  const renderMenuRow = (item: MenuItem, showBorder: boolean) => {
    const iconColor = item.danger ? colors.danger : colors.accent;
    const labelColor = item.danger ? colors.danger : colors.text;
    return (
      <Pressable
        key={item.label}
        style={[
          styles.menuRow,
          showBorder && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        ]}
        onPress={item.onPress}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: colors.accentMuted }]}>
          <FontAwesome name={item.icon} size={16} color={iconColor} />
        </View>
        <Text style={[styles.menuLabel, { color: labelColor }]}>{item.label}</Text>
        <FontAwesome name="chevron-right" size={11} color={colors.muted} />
      </Pressable>
    );
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.root}>
        <View
          style={[
            styles.drawer,
            shadowMd,
            {
              paddingTop: insets.top + Spacing.md,
              backgroundColor: colors.surfaceElevated,
              borderRightColor: colors.border,
            },
          ]}
        >
          <ScrollView
            style={styles.drawerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerContent}
          >
            <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
              <View style={[styles.avatarRing, { backgroundColor: colors.accentMuted, borderColor: colors.border }]}>
                <Logo size={52} />
              </View>
              {user ? (
                <>
                  <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                  <Text style={[styles.userPhone, { color: colors.muted }]}>{user.phone || user.email}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.userName, { color: colors.text }]}>Welcome</Text>
                  <Text style={[styles.userPhone, { color: colors.muted }]}>
                    Login to save orders & addresses
                  </Text>
                </>
              )}
              <Pressable
                onPress={() => {
                  close();
                  if (user) router.push('/profile');
                  else router.push('/auth/login');
                }}
              >
                <LinearGradient
                  colors={['#D1AB66', '#B89550']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.profileBtn}
                >
                  <Text style={styles.profileBtnText}>VIEW PROFILE</Text>
                </LinearGradient>
              </Pressable>
            </View>

            <View style={styles.menuList}>
              {mainMenuItems.map((item, index) => renderMenuRow(item, index < mainMenuItems.length - 1))}

              <Pressable
                style={[
                  styles.menuRow,
                  !ratingsExpanded && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
                onPress={() => setRatingsExpanded((v) => !v)}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: colors.accentMuted }]}>
                  <FontAwesome name="star-o" size={16} color={colors.accent} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Ratings & Feedbacks</Text>
                <FontAwesome
                  name={ratingsExpanded ? 'chevron-down' : 'chevron-right'}
                  size={11}
                  color={colors.muted}
                />
              </Pressable>

              {ratingsExpanded
                ? ratingsSubItems.map((sub, index) => (
                    <Pressable
                      key={sub.label}
                      style={[
                        styles.subMenuRow,
                        {
                          borderBottomColor: colors.border,
                          borderBottomWidth: StyleSheet.hairlineWidth,
                        },
                        index === ratingsSubItems.length - 1 && styles.subMenuRowLast,
                      ]}
                      onPress={() => navigateSubItem(sub.path)}
                    >
                      <View style={[styles.subMenuIconWrap, { backgroundColor: colors.accentMuted }]}>
                        <FontAwesome name={sub.icon} size={13} color={colors.accent} />
                      </View>
                      <Text style={[styles.subMenuLabel, { color: colors.text }]}>{sub.label}</Text>
                      <FontAwesome name="chevron-right" size={10} color={colors.muted} />
                    </Pressable>
                  ))
                : null}

              {user ? (
                <Pressable
                  style={[styles.menuRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                  onPress={handleLogout}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: colors.accentMuted }]}>
                    <FontAwesome name="sign-out" size={16} color={colors.danger} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.danger }]}>Logout</Text>
                  <FontAwesome name="chevron-right" size={11} color={colors.muted} />
                </Pressable>
              ) : null}

              {!user ? (
                <Pressable
                  style={[styles.menuRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                  onPress={() => navigate('/auth/login')}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: colors.accentMuted }]}>
                    <FontAwesome name="sign-in" size={16} color={colors.accent} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>Login</Text>
                  <FontAwesome name="chevron-right" size={11} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.md }]}>
            <Pressable onPress={openWhatsApp}>
              <View style={[styles.contactBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.contactLogo, { backgroundColor: colors.accentMuted }]}>
                  <Logo size={28} variant="square" />
                </View>
                <Text style={[styles.contactText, { color: colors.text }]}>CONTACT US</Text>
                <View style={[styles.phoneCircle, { backgroundColor: colors.accent }]}>
                  <FontAwesome name="phone" size={14} color="#0a0a0a" />
                </View>
              </View>
            </Pressable>
            <View style={styles.footerLinks}>
              <Pressable onPress={() => navigate('/help')}>
                <Text style={[styles.termsLink, { color: colors.accent }]}>Terms & Conditions</Text>
              </Pressable>
              <Text style={[styles.versionText, { color: colors.muted }]}>V-{APP_VERSION}</Text>
            </View>
          </View>
        </View>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close menu" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    width: '82%',
    maxWidth: 340,
    height: '100%',
    flexDirection: 'column',
    borderRightWidth: 1,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerContent: {
    paddingBottom: Spacing.lg,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  profileSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  profileBtn: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: 0.6,
  },
  menuList: {
    paddingTop: Spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  subMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 12,
    paddingLeft: Spacing.lg + 52,
    paddingRight: Spacing.lg,
  },
  subMenuRowLast: {
    marginBottom: Spacing.xs,
  },
  subMenuIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subMenuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 'auto',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  contactLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  phoneCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  termsLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
