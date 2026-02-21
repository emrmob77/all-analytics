'use client';

import { AdPlatform } from '@/types';

interface PlatformIconProps {
  platform: AdPlatform;
  size?: number;
  className?: string;
}

type IconProps = { size?: number } & React.SVGProps<SVGSVGElement>;

export function GoogleIcon({ size = 14, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} {...rest}>
      <path fill="#4285F4" d="M18.8 10.2c0-.65-.06-1.28-.17-1.88H10v3.56h4.94c-.21 1.14-.87 2.11-1.84 2.76v2.3h2.98c1.74-1.6 2.74-3.96 2.74-6.74z"/>
      <path fill="#34A853" d="M10 19c2.48 0 4.56-.82 6.08-2.22l-2.98-2.3c-.82.55-1.86.88-3.1.88-2.38 0-4.4-1.61-5.12-3.77H1.8v2.37C3.32 16.98 6.44 19 10 19z"/>
      <path fill="#FBBC05" d="M4.88 11.59A5.07 5.07 0 014.59 10c0-.55.1-1.09.29-1.59V5.04H1.8A9.01 9.01 0 001 10c0 1.45.35 2.82.97 4.04l2.9-2.45z"/>
      <path fill="#EA4335" d="M10 4.48c1.34 0 2.54.46 3.49 1.37l2.62-2.62C14.55 1.74 12.47 1 10 1 6.44 1 3.32 3.02 1.8 5.96l3.08 2.45c.72-2.16 2.74-3.93 5.12-3.93z"/>
    </svg>
  );
}

export function MetaIcon({ size = 14, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} {...rest}>
      <path fill="#0866FF" d="M10 2C5.58 2 2 5.58 2 10c0 4.16 3.05 7.6 7.03 8.24v-5.83H6.9V10h2.13V8.17c0-2.1 1.25-3.25 3.16-3.25.92 0 1.87.16 1.87.16v2.06h-1.05c-1.04 0-1.36.64-1.36 1.3V10h2.31l-.37 2.41h-1.94v5.83C14.95 17.6 18 14.16 18 10c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

export function TikTokIcon({ size = 14, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} {...rest}>
      <path fill="#161823" d="M16.3 5.6a4 4 0 01-3.14-3.55V2h-2.88v11.4a2.41 2.41 0 01-2.4 2.08 2.41 2.41 0 01-2.4-2.41 2.41 2.41 0 012.4-2.41c.23 0 .45.04.66.09V7.83a6.27 6.27 0 00-.66-.04A5.28 5.28 0 002.6 13.1 5.28 5.28 0 007.88 18.4a5.28 5.28 0 005.27-5.28V7.46a6.84 6.84 0 003.99 1.28V5.89a4.03 4.03 0 01-.84-.29z"/>
    </svg>
  );
}

export function PinterestIcon({ size = 14, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} {...rest}>
      <path fill="#E60023" d="M10 2C5.58 2 2 5.58 2 10c0 3.53 2.2 6.55 5.3 7.76-.07-.66-.14-1.67.03-2.39.15-.65.98-4.14.98-4.14s-.25-.5-.25-1.24c0-1.16.67-2.02 1.51-2.02.71 0 1.05.53 1.05 1.17 0 .72-.46 1.79-.69 2.78-.2.83.42 1.5 1.23 1.5 1.48 0 2.61-1.56 2.61-3.8 0-1.99-1.43-3.38-3.47-3.38-2.36 0-3.75 1.77-3.75 3.6 0 .71.27 1.48.62 1.9.07.08.08.15.06.24-.06.26-.2.83-.23.94-.04.15-.13.18-.29.11-1.04-.49-1.69-2-1.69-3.23 0-2.63 1.91-5.04 5.51-5.04 2.89 0 5.14 2.06 5.14 4.82 0 2.87-1.81 5.18-4.33 5.18-.85 0-1.64-.44-1.91-.96l-.52 1.98c-.19.72-.7 1.63-1.04 2.18.78.24 1.61.37 2.47.37 4.42 0 8-3.58 8-8s-3.58-8-8-8z"/>
    </svg>
  );
}

export function PlatformIcon({ platform, size = 14, className }: PlatformIconProps) {
  switch (platform) {
    case 'google':
      return <GoogleIcon size={size} className={className} />;
    case 'meta':
      return <MetaIcon size={size} className={className} />;
    case 'tiktok':
      return <TikTokIcon size={size} className={className} />;
    case 'pinterest':
      return <PinterestIcon size={size} className={className} />;
    default:
      return null;
  }
}
