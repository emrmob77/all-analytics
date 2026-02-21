'use client';

import { PLATFORMS } from '@/types';
import { PlatformIcon } from '@/components/ui/platform-icons';
import type { AdPlatform } from '@/types';

// ---------------------------------------------------------------------------
// PlatformFilter — single-select platform tab strip
// ---------------------------------------------------------------------------

export interface PlatformFilterProps {
  selected: AdPlatform | 'all';
  onChange: (platform: AdPlatform | 'all') => void;
  availablePlatforms?: AdPlatform[];
}

export function PlatformFilter({
  selected,
  onChange,
  availablePlatforms,
}: PlatformFilterProps) {
  const platforms = availablePlatforms
    ? PLATFORMS.filter(p => p.id === 'all' || availablePlatforms.includes(p.id as AdPlatform))
    : PLATFORMS;

  return (
    <div className="flex flex-wrap gap-1.5">
      {platforms.map(p => {
        const isActive = selected === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id as AdPlatform | 'all')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border-[1.5px] ${
              isActive ? 'font-semibold' : 'border-[#E3E8EF] bg-white text-[#5F6368] hover:bg-gray-50'
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
