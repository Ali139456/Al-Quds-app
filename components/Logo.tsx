import { Image, ImageStyle, StyleProp, ViewStyle } from 'react-native';

/** Wide banner logo — width ÷ height (Al-Quds horizontal mark). */
export const LOGO_ASPECT_RATIO = 3.35;

const LOGO_SOURCE = require('../assets/images/al-quds-logo.png');

interface LogoProps {
  /** Height in px; width scales for horizontal variant. */
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** horizontal = full banner (default); square = fit inside size×size box */
  variant?: 'horizontal' | 'square';
}

export default function Logo({ size = 48, style, variant = 'horizontal' }: LogoProps) {
  const dimensions: ImageStyle =
    variant === 'horizontal'
      ? { width: Math.round(size * LOGO_ASPECT_RATIO), height: size }
      : { width: size, height: size };

  return (
    <Image
      source={LOGO_SOURCE}
      style={[dimensions, style as ImageStyle]}
      resizeMode="contain"
      accessibilityLabel="Al-Quds logo"
    />
  );
}
