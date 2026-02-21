'use client';

import { PLATFORMS } from '@/types';
import { PlatformIcon } from '@/components/ui/platform-icons';
import type { AdPlatform } from '@/types';

export interface PlatformFilterProps {
  value: AdPlatform | 'all';
  onChange: (platform: AdPlatform | 'all') => void;
}

export function PlatformFilter({ value, onChange }: PlatformFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PLATFORMS.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border-[1.5px] ${
              active
                ? 'font-semibold'
                : 'border-[#E3E8EF] bg-white text-[#5F6368] hover:bg-gray-50'
            }`}
            style={
              active
                ? { borderColor: p.color, backgroundColor: p.bgColor, color: p.color }
                : undefined
            }
          >
            {p.id !== 'all' && <PlatformIcon platform={p.id as AdPlatform} size={14} />}
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
