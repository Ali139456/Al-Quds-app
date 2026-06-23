import { Image, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

/** Wide banner logo — width ÷ height (Al-Quds horizontal mark). */
export const LOGO_ASPECT_RATIO = 2.4;

const LOGO_BANNER = require('../assets/images/al-quds-logo.png');
const LOGO_MARK = require('../assets/images/al-quds-mark.png');
const LOGO_ICON = require('../assets/images/al-quds-icon.png');

interface LogoProps {
  /** Height in px; width scales for horizontal variant. */
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** horizontal = wordmark; square = icon mark for avatars; banner = full hero banner */
  variant?: 'horizontal' | 'square' | 'banner';
}

export default function Logo({ size = 48, style, variant = 'horizontal' }: LogoProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  let source = LOGO_MARK;
  if (variant === 'square') source = LOGO_ICON;
  else if (variant === 'banner') source = LOGO_BANNER;
  else if (isDark) source = LOGO_MARK;

  const aspect =
    variant === 'banner' ? 3.35 : variant === 'horizontal' ? LOGO_ASPECT_RATIO : 1;

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
