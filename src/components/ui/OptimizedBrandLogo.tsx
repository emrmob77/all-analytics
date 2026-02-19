"use client";

import { memo } from "react";

import { PlatformLogo, type PlatformLogoName } from "@/components/icons/PlatformLogos";
import { cn } from "@/utils/cn";

interface OptimizedBrandLogoProps {
  brand: PlatformLogoName;
  size?: number;
  className?: string;
}

/**
 * Stable logo renderer that uses local SVG assets for consistent colors.
 */
const OptimizedBrandLogo = memo(function OptimizedBrandLogo({ brand, className, size = 20 }: OptimizedBrandLogoProps) {
  return <PlatformLogo className={cn("shrink-0", className)} name={brand} size={size} />;
});

export default OptimizedBrandLogo;
