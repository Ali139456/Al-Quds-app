import { Image, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

/** Wide banner logo aspect ratio (processed Al-Quds mark). */
export const LOGO_ASPECT_RATIO = 3312 / 893;

const LOGO_LIGHT = require('../assets/images/al-quds-logo-light.png');
const LOGO_DARK = require('../assets/images/al-quds-logo-dark.png');
const LOGO_ICON = require('../assets/images/al-quds-icon.png');

interface LogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  variant?: 'horizontal' | 'square' | 'banner';
}

export default function Logo({ size = 48, style, variant = 'horizontal' }: LogoProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  let source = isDark ? LOGO_DARK : LOGO_LIGHT;
  if (variant === 'square') source = LOGO_ICON;

  const aspect = variant === 'square' ? 1 : LOGO_ASPECT_RATIO;

  const dimensions: ImageStyle =
    variant === 'square'
      ? { width: size, height: size }
      : { width: Math.round(size * aspect), height: size };

  return (
    <Image
      source={source}
      style={[dimensions, style as ImageStyle]}
      resizeMode="contain"
      accessibilityLabel="Al-Quds logo"
    />
  );
}
