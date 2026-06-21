import { Platform, ViewStyle } from 'react-native';

function webShadow(boxShadow: string): ViewStyle {
  return Platform.OS === 'web' ? ({ boxShadow } as ViewStyle) : {};
}

function iosShadow(
  offsetY: number,
  opacity: number,
  radius: number,
  color = '#000'
): ViewStyle {
  return Platform.OS === 'ios'
    ? {
        shadowColor: color,
        shadowOffset: { width: 0, height: offsetY },
        shadowOpacity: opacity,
        shadowRadius: radius,
      }
    : {};
}

function androidElevation(elevation: number): ViewStyle {
  return Platform.OS === 'android' ? { elevation } : {};
}

/** Small card shadow */
export const shadowSm: ViewStyle = {
  ...webShadow('0 2px 8px rgba(0,0,0,0.06)'),
  ...iosShadow(2, 0.06, 8),
  ...androidElevation(2),
};

/** Medium card shadow */
export const shadowMd: ViewStyle = {
  ...webShadow('0 3px 12px rgba(0,0,0,0.12)'),
  ...iosShadow(3, 0.15, 8),
  ...androidElevation(4),
};

/** Large featured card shadow */
export const shadowLg: ViewStyle = {
  ...webShadow('0 4px 16px rgba(0,0,0,0.1)'),
  ...iosShadow(4, 0.1, 12),
  ...androidElevation(4),
};

/** FAB / accent glow */
export const shadowFab: ViewStyle = {
  ...webShadow('0 8px 20px rgba(209, 171, 102, 0.45)'),
  ...iosShadow(8, 0.45, 12, '#D1AB66'),
  ...androidElevation(14),
};

/** Toast shadow */
export const shadowToast: ViewStyle = {
  ...webShadow('0 8px 28px rgba(0,0,0,0.35)'),
  ...iosShadow(6, 0.28, 12),
  ...androidElevation(10),
};
