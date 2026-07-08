'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/providers/ThemeProvider';

const LOGO_ASPECT = 3312 / 893;

type BrandLogoProps = {
  variant?: 'mark' | 'icon';
  height?: number;
  href?: string | null;
  className?: string;
};

export function BrandLogo({ variant = 'mark', height = 36, href = '/', className = '' }: BrandLogoProps) {
  const { theme, mounted } = useTheme();

  if (variant === 'icon') {
    const image = (
      <Image
        src="/al-quds-icon.png"
        alt="Al-Quds"
        width={height}
        height={height}
        className={`object-contain ${className}`}
        style={{ width: height, height }}
        priority
      />
    );
    return href ? (
      <Link href={href} className="inline-flex shrink-0 items-center transition hover:opacity-90">
        {image}
      </Link>
    ) : (
      image
    );
  }

  const src = mounted && theme === 'dark' ? '/al-quds-logo-dark.png' : '/al-quds-logo-light.png';
  const width = Math.round(height * LOGO_ASPECT);

  const image = (
    <Image
      src={src}
      alt="Al-Quds"
      width={width}
      height={height}
      className={`w-auto object-contain ${className}`}
      style={{ height, maxWidth: width }}
      priority
    />
  );

  if (!href) return image;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center transition hover:opacity-90">
      {image}
    </Link>
  );
}
