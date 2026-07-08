import { Image, ImageStyle } from 'expo-image';
import { useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { resolveFoodImageUri, IMAGE_WIDTH } from '@/utils/resolveFoodImage';

type Props = {
  image?: string;
  style?: StyleProp<ImageStyle>;
  emojiStyle?: StyleProp<TextStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  fallbackEmoji?: string;
  priority?: 'low' | 'normal' | 'high';
  /** Request width from API image resize (smaller = faster). */
  width?: number;
};

function toContentFit(resizeMode: Props['resizeMode']) {
  if (resizeMode === 'contain') return 'contain';
  if (resizeMode === 'stretch') return 'fill';
  return 'cover';
}

export default function FoodImage({
  image,
  style,
  emojiStyle,
  resizeMode = 'cover',
  fallbackEmoji = '🍔',
  priority = 'normal',
  width = IMAGE_WIDTH.card,
}: Props) {
  const [loadFailed, setLoadFailed] = useState(false);
  const uri = resolveFoodImageUri(image, width);
  if (uri && !loadFailed) {
    return (
      <Image
        source={{ uri }}
        style={style}
        contentFit={toContentFit(resizeMode)}
        cachePolicy="memory-disk"
        recyclingKey={uri}
        transition={120}
        priority={priority}
        onError={() => setLoadFailed(true)}
      />
    );
  }
  return <Text style={emojiStyle}>{image || fallbackEmoji}</Text>;
}
