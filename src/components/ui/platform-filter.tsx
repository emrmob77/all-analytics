'use client';

import { PlatformIcon } from '@/components/ui/platform-icons';
import { PLATFORMS } from '@/types';
import type { AdPlatform } from '@/types';

// ---------------------------------------------------------------------------
// PlatformFilter
// ---------------------------------------------------------------------------

export interface PlatformFilterProps {
  value: AdPlatform | 'all';
  onChange: (platform: AdPlatform | 'all') => void;
  /** Subset of platforms to show. Defaults to all four + "all". */
  platforms?: Array<AdPlatform | 'all'>;
  disabled?: boolean;
}

export function PlatformFilter({
  value,
  onChange,
  platforms,
  disabled = false,
}: PlatformFilterProps) {
  const visiblePlatforms = platforms
    ? PLATFORMS.filter(p => platforms.includes(p.id))
    : PLATFORMS;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visiblePlatforms.map(p => {
        const isActive = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => !disabled && onChange(p.id)}
            disabled={disabled}
            className={`flex items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              isActive
                ? 'font-semibold'
                : 'border-[#E3E8EF] bg-white text-[#5F6368] hover:bg-gray-50'
            }`}
            style={
              isActive
                ? {
                    borderColor: p.color,
                    backgroundColor: p.bgColor,
                    color: p.color,
                  }
                : undefined
            }
          >
            {p.id !== 'all' && (
              <PlatformIcon platform={p.id as AdPlatform} size={14} />
            )}
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
