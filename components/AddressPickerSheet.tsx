import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
  PanResponder,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useAddress } from '@/contexts/AddressContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import DeliveryLocationPicker from '@/components/DeliveryLocationPicker';
import { Radius, Spacing } from '@/constants/Spacing';
import type { SavedAddress } from '@/types';

function addressSubtitle(addr: SavedAddress) {
  const line = addr.area ? `${addr.area}, ${addr.addressLine}` : addr.addressLine;
  const parts = [line, addr.city].filter(Boolean);
  return parts.join(' · ');
}

const DRAG_CLOSE_THRESHOLD = 80;
const ADDRESS_ROW_H = 76;
const MAX_VISIBLE_ROWS = 3;
const useNativeDriver = Platform.OS !== 'web';

function estimateListSheetHeight(addressCount: number, isLoggedIn: boolean, bottomInset: number) {
  const header = 88;
  const newLoc = 72;
  const addBtn = 48;
  const footerPad = bottomInset + Spacing.md;
  if (!isLoggedIn || addressCount === 0) {
    return header + newLoc + 88 + addBtn + footerPad;
  }
  const listH = Math.min(addressCount, MAX_VISIBLE_ROWS) * ADDRESS_ROW_H;
  return header + newLoc + listH + addBtn + footerPad;
}

export default function AddressPickerSheet() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { user } = useAuth();
  const { addresses, selectedAddress } = useAddress();
  const {
    showSetupModal,
    setShowSetupModal,
    dismissSetupModal,
    applySavedAddress,
    saveDeliverySetup,
  } = useDelivery();

  const [showMapPicker, setShowMapPicker] = useState(false);
  const mapSheetHeight = Math.min(height * 0.82, 580);
  const listSheetHeight = estimateListSheetHeight(
    addresses.length,
    !!user,
    insets.bottom
  );
  const sheetHeight = showMapPicker ? mapSheetHeight : listSheetHeight;
  const listScrollMax = addresses.length > MAX_VISIBLE_ROWS ? MAX_VISIBLE_ROWS * ADDRESS_ROW_H : undefined;

  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const snapRef = useRef(0);
  const sheetHeightRef = useRef(sheetHeight);
  sheetHeightRef.current = sheetHeight;

  useEffect(() => {
    if (!showSetupModal) {
      setShowMapPicker(false);
      translateY.setValue(sheetHeight);
      snapRef.current = 0;
      return;
    }
    snapRef.current = 0;
    translateY.setValue(sheetHeight);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
    }).start(() => {
      snapRef.current = 0;
    });
  }, [showSetupModal, sheetHeight, translateY]);

  const animateTo = (toValue: number, onDone?: () => void) => {
    snapRef.current = toValue;
    Animated.spring(translateY, {
      toValue,
      useNativeDriver,
      damping: 24,
      stiffness: 240,
    }).start(() => onDone?.());
  };

  const closeSheet = () => {
    setShowMapPicker(false);
    Animated.timing(translateY, {
      toValue: sheetHeightRef.current,
      duration: 220,
      useNativeDriver,
    }).start(() => dismissSetupModal());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          snapRef.current = value;
          translateY.setOffset(value);
          translateY.setValue(0);
        });
      },
      onPanResponderMove: (_, g) => {
        const maxDy = sheetHeightRef.current - snapRef.current;
        translateY.setValue(Math.min(maxDy, Math.max(0, g.dy)));
      },
      onPanResponderRelease: (_, g) => {
        translateY.flattenOffset();
        const total = snapRef.current + g.dy;

        if (total > DRAG_CLOSE_THRESHOLD || g.vy > 0.8) {
          closeSheet();
          return;
        }
        animateTo(0);
      },
    })
  ).current;

  const openAddAddress = () => {
    setShowSetupModal(false);
    setShowMapPicker(false);
    if (user) router.push('/add-address');
    else router.push('/auth/login');
  };

  const handleSelectAddress = (addr: SavedAddress) => {
    void applySavedAddress(addr);
    setShowMapPicker(false);
  };

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, sheetHeight],
    outputRange: [0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={showSetupModal} animationType="none" transparent statusBarTranslucent onRequestClose={closeSheet}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              height: showMapPicker ? sheetHeight : undefined,
              paddingBottom: insets.bottom + Spacing.md,
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.dragZone}>
            <View style={[styles.handle, { backgroundColor: colors.accent }]} />
            {!showMapPicker ? (
              <>
                <Text style={[styles.title, { color: colors.text, marginTop: Spacing.md }]}>
                  Choose delivery address
                </Text>
                <Text style={[styles.subtitle, { color: colors.muted, marginTop: 2 }]}>
                  Pick Home or another saved address — delivery goes there, not where you are now.
                </Text>
              </>
            ) : null}
          </View>

          {showMapPicker ? (
            <>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setShowMapPicker(false)} hitSlop={10} style={styles.backRow}>
                  <FontAwesome name="arrow-left" size={16} color={colors.text} />
                  <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
                </Pressable>
                <Text style={[styles.title, { color: colors.text }]}>Select new location</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  Rawalpindi only — we do not deliver outside this area
                </Text>
              </View>
              <ScrollView
                style={styles.mapScroll}
                contentContainerStyle={styles.mapScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <DeliveryLocationPicker />
              </ScrollView>
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Pressable
                  style={[styles.confirmBtn, { backgroundColor: colors.accent }]}
                  onPress={() => void saveDeliverySetup().then((ok) => ok && setShowMapPicker(false))}
                >
                  <Text style={styles.confirmBtnText}>Confirm location</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Pressable
                style={[styles.newLocationRow, { borderBottomColor: colors.border }]}
                onPress={() => setShowMapPicker(true)}
              >
                <View style={[styles.newLocationIcon, { backgroundColor: colors.accentMuted }]}>
                  <FontAwesome name="map-o" size={16} color={colors.accent} />
                </View>
                <View style={styles.newLocationTextWrap}>
                  <Text style={[styles.newLocationText, { color: colors.accent }]}>Search on map</Text>
                  <Text style={[styles.newLocationHint, { color: colors.muted }]}>
                    Find a new area — not your GPS location
                  </Text>
                </View>
              </Pressable>

              <ScrollView
                style={[styles.listScroll, listScrollMax ? { maxHeight: listScrollMax } : null]}
                showsVerticalScrollIndicator={addresses.length > MAX_VISIBLE_ROWS}
                scrollEnabled={addresses.length > MAX_VISIBLE_ROWS}
              >
                {user && addresses.length > 0 ? (
                  addresses.map((addr, index) => {
                    const selected = selectedAddress?.id === addr.id;
                    return (
                      <Pressable
                        key={addr.id}
                        style={[
                          styles.addressRow,
                          index < addresses.length - 1 && {
                            borderBottomColor: colors.border,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                          },
                        ]}
                        onPress={() => handleSelectAddress(addr)}
                      >
                        <View
                          style={[styles.radio, { borderColor: selected ? colors.accent : colors.muted }]}
                        >
                          {selected ? <View style={[styles.radioDot, { backgroundColor: colors.accent }]} /> : null}
                        </View>
                        <View style={styles.addressText}>
                          <Text style={[styles.addressLabel, { color: colors.text }]} numberOfLines={1}>
                            {addr.label}
                          </Text>
                          <Text style={[styles.addressSub, { color: colors.muted }]} numberOfLines={2}>
                            {addressSubtitle(addr)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={styles.emptyWrap}>
                    <Text style={[styles.emptyText, { color: colors.muted }]}>
                      {user
                        ? 'No saved addresses yet. Add one or pick a new location on the map.'
                        : 'Login to save addresses, or select a new location on the map.'}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <Pressable style={styles.addNewBtn} onPress={openAddAddress}>
                <Text style={[styles.addNewText, { color: colors.accent }]}>+ ADD NEW ADDRESS</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      } as object,
      default: {},
    }),
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  dragZone: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  newLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  newLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newLocationText: {
    fontSize: 15,
    fontWeight: '700',
  },
  newLocationTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  newLocationHint: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  listScroll: {
    flexGrow: 0,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  addressText: {
    flex: 1,
    minWidth: 0,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  addressSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  addNewBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  addNewText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mapScroll: {
    flex: 1,
    maxHeight: 420,
  },
  mapScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  confirmBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#0a0a0a',
    fontSize: 15,
    fontWeight: '800',
  },
});
