import type { ComponentPropsWithoutRef, JSX, ReactNode } from "react";

/**
 * Supported platform logo keys used across sidebar and data tables.
 */
export type PlatformLogoName =
  | "google-ads"
  | "facebook"
  | "ga4"
  | "tiktok"
  | "search-console"
  | "linkedin"
  | "yandex-ads";

/**
 * Base props for platform SVG logos.
 */
export interface PlatformLogoProps extends Omit<ComponentPropsWithoutRef<"svg">, "children"> {
  size?: number;
  title?: string;
}

function SvgBase({
  children,
  className,
  size = 24,
  title,
  viewBox = "0 0 24 24",
  ...rest
}: PlatformLogoProps & { children: ReactNode }) {
  return (
    <svg
      aria-label={title}
      className={className}
      fill="none"
      height={size}
      role="img"
      viewBox={viewBox}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {children}
    </svg>
  );
}

/**
 * Google Ads logo.
 */
export function GoogleAdsLogo({ title = "Google Ads", ...props }: PlatformLogoProps) {
  return (
    <SvgBase title={title} {...props}>
      <path d="M9.6 2.8c1.8-1.1 4.2-.5 5.2 1.4l6.4 12a3.8 3.8 0 1 1-6.7 3.6l-6.4-12A3.9 3.9 0 0 1 9.6 2.8Z" fill="#4285F4" />
      <path d="M7.2 8.9c1.8-1 4.2-.2 5.2 1.6l4.1 7.6A3.8 3.8 0 1 1 9.8 22l-4.1-7.7A3.9 3.9 0 0 1 7.2 8.9Z" fill="#34A853" />
      <circle cx="18.5" cy="18.2" fill="#FBBC05" r="3.2" />
      <circle cx="6.7" cy="12.1" fill="#EA4335" r="1.4" />
    </SvgBase>
  );
}

/**
 * Meta/Facebook logo.
 */
export function FacebookLogo({ title = "Meta Ads", ...props }: PlatformLogoProps) {
  return (
    <SvgBase title={title} {...props}>
      <rect fill="#1877F2" height="22" rx="6" width="22" x="1" y="1" />
      <path
        d="M14.4 8.2h-1.3c-.9 0-1.1.4-1.1 1.1V11h2.4l-.4 2.4H12v6.4H9.6v-6.4H7.5V11h2.1V9.1c0-2.1 1.3-3.3 3.2-3.3.9 0 1.7.1 2 .1v2.3Z"
        fill="white"
      />
    </SvgBase>
  );
}

/**
 * Google Analytics 4 logo.
 */
export function GA4Logo({ title = "Google Analytics 4", ...props }: PlatformLogoProps) {
  return (
    <SvgBase title={title} {...props}>
      <rect fill="#E8710A" height="8" rx="2.2" width="4.2" x="3.4" y="12.6" />
      <rect fill="#F29900" height="13.4" rx="2.2" width="4.2" x="10.1" y="7.4" />
      <circle cx="17.9" cy="8" fill="#F9AB00" r="2.9" />
      <circle cx="18.2" cy="16.9" fill="#E8710A" r="3.6" />
    </SvgBase>
  );
}

/**
 * TikTok logo. Uses currentColor to adapt in dark and light themes.
 */
export function TikTokLogo({ className = "text-black dark:text-white", title = "TikTok Ads", ...props }: PlatformLogoProps) {
  return (
    <SvgBase className={className} title={title} {...props}>
      <circle cx="12" cy="12" fill="currentColor" r="11" />
      <path d="M14.8 6.5a4.6 4.6 0 0 0 3.2 2v2.1a6.4 6.4 0 0 1-3.2-.8v4.5a3.8 3.8 0 1 1-2.7-3.5v2a1.8 1.8 0 1 0 .9 1.5V6.5Z" fill="#25F4EE" />
      <path d="M14.4 6.8a4.5 4.5 0 0 0 3 1.8V10a5.9 5.9 0 0 1-3-.8v4.5a3.5 3.5 0 1 1-2.5-3.3v1.5a1.8 1.8 0 1 0 .8 1.5V6.8Z" fill="#FE2C55" />
      <path d="M14.6 6.7a4.5 4.5 0 0 0 3 1.9v1.6a6 6 0 0 1-3-.8V14a3.6 3.6 0 1 1-2.6-3.4v1.6a1.9 1.9 0 1 0 .9 1.6V6.7Z" fill="white" />
    </SvgBase>
  );
}

/**
 * Google Search Console logo.
 */
export function SearchConsoleLogo({ title = "Google Search Console", ...props }: PlatformLogoProps) {
  return (
    <SvgBase title={title} {...props}>
      <rect fill="#1A73E8" height="13" rx="2.2" width="10.8" x="2.8" y="4" />
      <rect fill="white" height="1.4" rx="0.7" width="6.1" x="5" y="7.1" />
      <rect fill="white" height="1.4" rx="0.7" width="4.8" x="5" y="10" />
      <circle cx="15.8" cy="15.3" r="4.3" stroke="#34A853" strokeWidth="2.1" />
      <path d="m18.9 18.5 2.3 2.3" stroke="#FBBC05" strokeLinecap="round" strokeWidth="2.1" />
    </SvgBase>
  );
}

/**
 * LinkedIn logo.
 */
export function LinkedInLogo({ title = "LinkedIn Ads", ...props }: PlatformLogoProps) {
  return (
    <SvgBase title={title} {...props}>
      <rect fill="#0A66C2" height="22" rx="5" width="22" x="1" y="1" />
      <rect fill="white" height="8.3" rx="0.7" width="2.1" x="6.1" y="10.1" />
      <circle cx="7.2" cy="7.1" fill="white" r="1.2" />
      <path d="M10.9 10.1h2v1.2c.4-.7 1.2-1.5 2.7-1.5 2.1 0 3.4 1.3 3.4 3.8v4.8h-2.2v-4.1c0-1.3-.5-2-1.6-2s-1.7.7-1.7 2v4.1H11z" fill="white" />
    </SvgBase>
  );
}

/**
 * Yandex Ads logo.
 */
export function YandexAdsLogo({ title = "Yandex Ads", ...props }: PlatformLogoProps) {
  return (
    <SvgBase title={title} {...props}>
      <rect fill="#FC3F1D" height="22" rx="6" width="22" x="1" y="1" />
      <path d="M10.2 6.6h3.6l-2.3 4.2 2.8 6.5h-2.6l-2.4-5.7-.9 1.7v4h-2.4V6.6h2.4v3.6l1.8-3.6Z" fill="white" />
    </SvgBase>
  );
}

const logoByName: Record<PlatformLogoName, (props: PlatformLogoProps) => JSX.Element> = {
  "google-ads": GoogleAdsLogo,
  facebook: FacebookLogo,
  ga4: GA4Logo,
  tiktok: TikTokLogo,
  "search-console": SearchConsoleLogo,
  linkedin: LinkedInLogo,
  "yandex-ads": YandexAdsLogo
};

/**
 * Renders a platform logo by name.
 */
export function PlatformLogo({ name, ...props }: PlatformLogoProps & { name: PlatformLogoName }) {
  const Component = logoByName[name];
  return <Component {...props} />;
}
