import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Image, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Themed';
import { router } from 'expo-router';
import type { Banner } from '@/hooks/useBanners';
import Colors from '@/constants/Colors';
import { CategoryGradients } from '@/constants/Gradients';
import { useColorScheme } from '@/components/useColorScheme';
import { API_BASE_URL } from '@/constants/api';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

const BANNER_HEIGHT = 180;

interface BannerSliderProps {
  banners: Banner[];
}

export default function BannerSlider({ banners }: BannerSliderProps) {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const gradients = CategoryGradients[colorScheme ?? 'light'];
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const bannerWidth = width - Spacing.lg * 2;

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * (bannerWidth + Spacing.md), animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(t);
  }, [banners.length, bannerWidth]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / (bannerWidth + Spacing.md));
    if (i >= 0 && i < banners.length) setIndex(i);
  };

  if (banners.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={bannerWidth + Spacing.md}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={styles.scrollContent}
      >
        {banners.map((b) => {
          const isImageUrl = b.image && (b.image.startsWith('http') || b.image.startsWith('/'));
          const imageUri = isImageUrl ? (b.image.startsWith('/') ? API_BASE_URL + b.image : b.image) : null;
          return (
            <Pressable
              key={b.id}
              style={[styles.banner, { width: bannerWidth }]}
              onPress={() => b.link && router.push(b.link as any)}
            >
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.bannerImage} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    style={styles.imageOverlay}
                  >
                    <Text style={styles.bannerTitle}>{b.title}</Text>
                    {b.subtitle ? <Text style={styles.bannerSubtitle}>{b.subtitle}</Text> : null}
                  </LinearGradient>
                </>
              ) : (
                <LinearGradient
                  colors={[gradients.burgers[0], gradients.pasta[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBanner}
                >
                  <View style={styles.bannerDecor} />
                  <Text style={styles.bannerEmoji}>{b.image || '🍔'}</Text>
                  <Text style={styles.bannerTitle}>{b.title}</Text>
                  {b.subtitle ? <Text style={styles.bannerSubtitle}>{b.subtitle}</Text> : null}
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>Order now →</Text>
                  </View>
                </LinearGradient>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index ? styles.dotActive : styles.dotInactive,
                { backgroundColor: i === index ? colors.accent : colors.border },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  banner: {
    height: BANNER_HEIGHT,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: Spacing.xl,
  },
  gradientBanner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  bannerDecor: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bannerEmoji: {
    fontSize: 52,
    marginBottom: Spacing.sm,
  },
  bannerTitle: {
    ...Typography.h2,
    color: '#fff',
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  orderBadge: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  orderBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
  },
  dotInactive: {
    width: 6,
  },
});
