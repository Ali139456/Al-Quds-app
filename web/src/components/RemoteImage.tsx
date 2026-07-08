import Image, { type ImageProps } from 'next/image';

function isExternalSrc(src: ImageProps['src']): boolean {
  if (typeof src !== 'string') return false;
  return src.startsWith('http://') || src.startsWith('https://');
}

/** Loads resized API images (?w=) — full originals are multi-MB on Railway. */
export function RemoteImage({ src, alt, priority, ...props }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      unoptimized={isExternalSrc(src)}
      {...props}
    />
  );
}
