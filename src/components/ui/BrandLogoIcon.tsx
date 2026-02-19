import { PlatformLogo, type PlatformLogoName } from "@/components/icons/PlatformLogos";

export type BrandLogoName = PlatformLogoName;

interface BrandLogoIconProps {
  brand: BrandLogoName;
  size?: number;
  className?: string;
}

/**
 * Backward-compatible wrapper for platform logos.
 */
function BrandLogoIcon({ brand, className, size = 20 }: BrandLogoIconProps) {
  return <PlatformLogo className={className} name={brand} size={size} />;
}

export default BrandLogoIcon;
