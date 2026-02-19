type BrandLogoName =
  | "google-ads"
  | "facebook"
  | "ga4"
  | "tiktok"
  | "search-console"
  | "linkedin"
  | "yandex-ads";

interface BrandLogoIconProps {
  brand: BrandLogoName;
  size?: number;
  className?: string;
}

function BrandLogoIcon({ brand, size = 20, className = "" }: BrandLogoIconProps) {
  if (brand === "google-ads") {
    return (
      <svg
        aria-label="Google Ads"
        className={className}
        height={size}
        viewBox="0 0 24 24"
        width={size}
      >
        <path d="M9.9 3.3a3.6 3.6 0 0 1 4.9 1.4l5 9.4a3.6 3.6 0 1 1-6.3 3.4l-5-9.4a3.6 3.6 0 0 1 1.4-4.8z" fill="#4285F4" />
        <path d="M6.1 10.8a3.4 3.4 0 0 1 4.6 1.3l2.5 4.5a3.4 3.4 0 1 1-5.9 3.2l-2.5-4.5a3.4 3.4 0 0 1 1.3-4.5z" fill="#34A853" />
        <circle cx="17.9" cy="18.1" fill="#FBBC05" r="3.1" />
      </svg>
    );
  }

  if (brand === "facebook") {
    return (
      <svg
        aria-label="Facebook"
        className={className}
        height={size}
        viewBox="0 0 24 24"
        width={size}
      >
        <rect fill="#1877F2" height="22" rx="6" width="22" x="1" y="1" />
        <path
          d="M14.6 8.1h-1.5c-1 0-1.2.5-1.2 1.2v1.6h2.6l-.4 2.6h-2.2v6.5H9.3v-6.5H7v-2.6h2.3V9.1c0-2.2 1.3-3.5 3.4-3.5 1 0 1.9.1 2.1.1z"
          fill="#fff"
        />
      </svg>
    );
  }

  if (brand === "ga4") {
    return (
      <svg aria-label="GA4" className={className} height={size} viewBox="0 0 24 24" width={size}>
        <rect fill="#E8710A" height="8" rx="2.3" width="4.2" x="3.2" y="12.8" />
        <rect fill="#F29900" height="13.2" rx="2.3" width="4.2" x="9.9" y="7.6" />
        <circle cx="17.8" cy="8.1" fill="#F9AB00" r="2.8" />
        <circle cx="18.2" cy="16.8" fill="#E8710A" r="3.6" />
      </svg>
    );
  }

  if (brand === "tiktok") {
    return (
      <svg
        aria-label="TikTok"
        className={className}
        height={size}
        viewBox="0 0 24 24"
        width={size}
      >
        <circle cx="12" cy="12" fill="#111" r="11" />
        <path d="M15.1 6.5c.6 1.1 1.7 1.9 3 2.1v2.1c-1 0-2-.3-3-.8v4.7a3.9 3.9 0 1 1-2.8-3.8v2.1a1.9 1.9 0 1 0 1 1.7V6.5z" fill="#25F4EE" />
        <path d="M14.7 6.9c.6 1 1.6 1.7 2.8 1.9v1.4c-.9 0-1.8-.3-2.8-.8v4.8a3.6 3.6 0 1 1-2.6-3.5v1.4a2 2 0 1 0 1 1.8V6.9z" fill="#FE2C55" />
        <path d="M14.9 6.7c.6 1 1.6 1.8 2.8 2v1.6c-.9 0-1.9-.3-2.8-.8v4.7a3.7 3.7 0 1 1-2.7-3.6v1.6a2 2 0 1 0 1 1.8V6.7z" fill="#fff" />
      </svg>
    );
  }

  if (brand === "search-console") {
    return (
      <svg
        aria-label="Search Console"
        className={className}
        height={size}
        viewBox="0 0 24 24"
        width={size}
      >
        <rect fill="#1A73E8" height="13" rx="2.2" width="10.5" x="3" y="4" />
        <rect fill="#fff" height="1.5" rx=".75" width="6" x="5.2" y="7.1" />
        <rect fill="#fff" height="1.5" rx=".75" width="4.8" x="5.2" y="10.1" />
        <circle cx="15.4" cy="15.4" fill="none" r="4.3" stroke="#34A853" strokeWidth="2.1" />
        <path d="m18.7 18.7 2.2 2.2" stroke="#FBBC05" strokeLinecap="round" strokeWidth="2.1" />
      </svg>
    );
  }

  if (brand === "yandex-ads") {
    return (
      <svg aria-label="Yandex Ads" className={className} height={size} viewBox="0 0 24 24" width={size}>
        <rect fill="#FC3F1D" height="22" rx="6" width="22" x="1" y="1" />
        <path d="M7 6.8h2.7l2.3 3.1 2.3-3.1H17l-3.7 5v5.4h-2.6v-5.4z" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg aria-label="LinkedIn" className={className} height={size} viewBox="0 0 24 24" width={size}>
      <rect fill="#0A66C2" height="22" rx="5" width="22" x="1" y="1" />
      <rect fill="#fff" height="8.3" rx=".7" width="2.1" x="6" y="10.2" />
      <circle cx="7" cy="7.2" fill="#fff" r="1.2" />
      <path d="M11 10.2h2v1.2c.3-.7 1.2-1.5 2.7-1.5 2 0 3.3 1.2 3.3 3.8v4.7h-2.1v-4.1c0-1.2-.5-2-1.6-2-1.1 0-1.7.8-1.7 2v4.1H11z" fill="#fff" />
    </svg>
  );
}

export default BrandLogoIcon;
export type { BrandLogoName };
