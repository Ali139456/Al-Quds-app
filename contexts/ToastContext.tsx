import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing } from '@/constants/Spacing';
import { shadowToast } from '@/constants/shadows';

const useNativeDriver = Platform.OS !== 'web';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
};

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type DialogState = {
  title: string;
  message: string;
  buttons: AlertButton[];
};

type ToastAPI = {
  show: (message: string, options?: { title?: string; type?: ToastType; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  confirm: (title: string, message: string, options?: { confirmText?: string; cancelText?: string }) => Promise<boolean>;
};

const ToastContext = createContext<ToastAPI | null>(null);

let toastRef: ToastAPI | null = null;

export const toast: ToastAPI = {
  show: (message, options) => toastRef?.show(message, options),
  success: (message, title) => toastRef?.success(message, title),
  error: (message, title) => toastRef?.error(message, title),
  info: (message, title) => toastRef?.info(message, title),
  warning: (message, title) => toastRef?.warning(message, title),
  alert: (title, message, buttons) => toastRef?.alert(title, message, buttons),
  confirm: (title, message, options) =>
    toastRef?.confirm(title, message, options) ?? Promise.resolve(false),
};

const TOAST_ICONS: Record<ToastType, React.ComponentProps<typeof FontAwesome>['name']> = {
  success: 'check-circle',
  error: 'times-circle',
  info: 'info-circle',
  warning: 'exclamation-circle',
};

const TOAST_DURATION = 3800;

function ToastCard({
  item,
  onDismiss,
  colors,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
  colors: (typeof Colors)['dark'];
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver, speed: 18, bounciness: 6 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver }),
        Animated.timing(translateY, { toValue: -12, duration: 180, useNativeDriver }),
      ]).start(() => onDismiss(item.id));
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [item.id, onDismiss, opacity, translateY]);

  const accent =
    item.type === 'success'
      ? colors.success
      : item.type === 'error'
        ? colors.danger
        : item.type === 'warning'
          ? '#F5C542'
          : colors.accent;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          opacity,
          transform: [{ translateY }],
          ...shadowToast,
        },
      ]}
    >
      <View style={[styles.toastIconWrap, { backgroundColor: accent + '22' }]}>
        <FontAwesome name={TOAST_ICONS[item.type]} size={18} color={accent} />
      </View>
      <View style={styles.toastTextWrap}>
        {item.title ? (
          <Text style={[styles.toastTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
        ) : null}
        <Text style={[styles.toastMessage, { color: colors.textSecondary }]} numberOfLines={4}>
          {item.message}
        </Text>
      </View>
      <Pressable onPress={() => onDismiss(item.id)} hitSlop={10} style={styles.toastClose}>
        <FontAwesome name="times" size={14} color={colors.muted} />
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const confirmResolver = useRef<((value: boolean) => void) | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (type: ToastType, message: string, title?: string, duration?: number) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, type, title, message }]);
      if (duration && duration !== TOAST_DURATION) {
        setTimeout(() => dismissToast(id), duration);
      }
    },
    [dismissToast]
  );

  const closeDialog = useCallback((button?: AlertButton) => {
    setDialog(null);
    button?.onPress?.();
    if (confirmResolver.current) {
      const isConfirm = button?.style !== 'cancel';
      confirmResolver.current(isConfirm);
      confirmResolver.current = null;
    }
  }, []);

  const api = useMemo<ToastAPI>(
    () => ({
      show: (message, options) => {
        pushToast(options?.type ?? 'info', message, options?.title, options?.duration);
      },
      success: (message, title) => pushToast('success', message, title),
      error: (message, title) => pushToast('error', message, title),
      info: (message, title) => pushToast('info', message, title),
      warning: (message, title) => pushToast('warning', message, title),
      alert: (title, message = '', buttons) => {
        if (!buttons || buttons.length === 0) {
          pushToast('info', message || title, message ? title : undefined);
          return;
        }
        if (buttons.length === 1 && !buttons[0].onPress) {
          pushToast('info', message, title);
          buttons[0].onPress?.();
          return;
        }
        setDialog({ title, message, buttons });
      },
      confirm: (title, message, options) =>
        new Promise<boolean>((resolve) => {
          confirmResolver.current = resolve;
          setDialog({
            title,
            message,
            buttons: [
              { text: options?.cancelText ?? 'Cancel', style: 'cancel' },
              { text: options?.confirmText ?? 'Confirm', style: 'default' },
            ],
          });
        }),
    }),
    [pushToast]
  );

  useEffect(() => {
    toastRef = api;
    return () => {
      toastRef = null;
    };
  }, [api]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View
        style={[
          styles.toastHost,
          { top: insets.top + (Platform.OS === 'web' ? 12 : 8), pointerEvents: 'box-none' },
        ]}
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismissToast} colors={colors} />
        ))}
      </View>

      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => closeDialog({ text: 'Cancel', style: 'cancel' })}>
        <Pressable
          style={styles.dialogOverlay}
          onPress={() => {
            const cancelBtn = dialog?.buttons.find((b) => b.style === 'cancel');
            closeDialog(cancelBtn ?? { text: 'Cancel', style: 'cancel' });
          }}
        >
          <Pressable
            style={[styles.dialogBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            {dialog ? (
              <>
                <Text style={[styles.dialogTitle, { color: colors.text }]}>{dialog.title}</Text>
                {dialog.message ? (
                  <Text style={[styles.dialogMessage, { color: colors.textSecondary }]}>{dialog.message}</Text>
                ) : null}
                <View style={styles.dialogActions}>
                  {dialog.buttons.map((btn, index) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';
                    return (
                      <Pressable
                        key={`${btn.text}-${index}`}
                        style={[
                          styles.dialogBtn,
                          isCancel
                            ? { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }
                            : { backgroundColor: isDestructive ? colors.danger : colors.accent },
                        ]}
                        onPress={() => closeDialog(btn)}
                      >
                        <Text
                          style={[
                            styles.dialogBtnText,
                            { color: isCancel ? colors.text : '#fff' },
                          ]}
                        >
                          {btn.text}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TOAST_WIDTH = Platform.OS === 'web' ? 520 : undefined;

const styles = StyleSheet.create({
  toastHost: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
    gap: Spacing.sm,
    alignItems: 'flex-start',
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        right: 'auto',
        width: TOAST_WIDTH,
        maxWidth: 'calc(100vw - 32px)' as unknown as number,
      },
    }),
  },
  toast: {
    width: Platform.OS === 'web' ? TOAST_WIDTH : '100%',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  toastIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  toastTextWrap: { flex: 1, minWidth: 0 },
  toastTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  toastMessage: { fontSize: 13, lineHeight: 18 },
  toastClose: { padding: 4, marginTop: 2 },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    ...Platform.select({
      web: { boxShadow: '0 20px 48px rgba(0,0,0,0.45)' } as object,
    }),
  },
  dialogTitle: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.sm },
  dialogMessage: { fontSize: 14, lineHeight: 21, marginBottom: Spacing.xl },
  dialogActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
  dialogBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    minWidth: 96,
    alignItems: 'center',
  },
  dialogBtnText: { fontSize: 14, fontWeight: '700' },
});
