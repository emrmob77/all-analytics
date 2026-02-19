"use client";

import { memo, useState } from "react";

import BrandLogoIcon, { type BrandLogoName } from "@/components/ui/BrandLogoIcon";
import { cn } from "@/utils/cn";

interface OptimizedBrandLogoProps {
  brand: BrandLogoName;
  size?: number;
  className?: string;
}

interface BrandLogoAsset {
  alt: string;
  png: string;
  webp: string;
}

const brandAssets: Record<BrandLogoName, BrandLogoAsset> = {
  "google-ads": {
    alt: "Google Ads",
    png: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/google.png",
    webp: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/google.webp"
  },
  facebook: {
    alt: "Facebook Ads",
    png: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/facebook.png",
    webp: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/facebook.webp"
  },
  ga4: {
    alt: "GA4",
    png: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/google-analytics.png",
    webp: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/google-analytics.webp"
  },
  tiktok: {
    alt: "TikTok Ads",
    png: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/tiktok.png",
    webp: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/tiktok.webp"
  },
  "search-console": {
    alt: "Search Console",
    png: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/google-search-console.png",
    webp: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/google-search-console.webp"
  },
  linkedin: {
    alt: "LinkedIn Ads",
    png: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/linkedin.png",
    webp: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/linkedin.webp"
  },
  "yandex-ads": {
    alt: "Yandex Ads",
    png: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/yandex.png",
    webp: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/yandex.webp"
  }
};

const OptimizedBrandLogo = memo(function OptimizedBrandLogo({
  brand,
  className,
  size = 20
}: OptimizedBrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const asset = brandAssets[brand];

  if (!asset || failed) {
    return <BrandLogoIcon brand={brand} className={className} size={size} />;
  }

  return (
    <picture className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      <source srcSet={`${asset.webp} 1x, ${asset.webp} 2x`} type="image/webp" />
      <img
        alt={asset.alt}
        className="block object-contain"
        decoding="async"
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        sizes={`${size}px`}
        src={asset.png}
        srcSet={`${asset.png} 1x, ${asset.png} 2x`}
        width={size}
      />
    </picture>
  );
});

export default OptimizedBrandLogo;
