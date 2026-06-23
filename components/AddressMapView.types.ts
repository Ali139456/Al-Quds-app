import type { ViewStyle } from 'react-native';

export type AddressMapViewProps = {
  lat: number | null;
  lng: number | null;
  onPress?: (lat: number, lng: number) => void;
  mapRef?: React.RefObject<{ animateToRegion: (region: unknown) => void } | null>;
  style?: ViewStyle;
  height?: number;
  markerTitle?: string;
};
