'use client';

import { GA4Icon, GoogleIcon, MetaIcon, PinterestIcon, SearchConsoleIcon, TikTokIcon } from '@/components/ui/platform-icons';

const PLATFORM_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ size?: number }>;
}> = {
  'google-ads': {
    label: 'Google Ads',
    color: '#1A73E8',
    bgColor: '#E8F0FE',
    icon: GoogleIcon,
  },
  'meta-ads': {
    label: 'Meta Ads',
    color: '#0866FF',
    bgColor: '#E8F0FE',
    icon: MetaIcon,
  },
  'tiktok-ads': {
    label: 'TikTok Ads',
    color: '#161823',
    bgColor: '#F1F3F4',
    icon: TikTokIcon,
  },
  'pinterest-ads': {
    label: 'Pinterest Ads',
    color: '#E60023',
    bgColor: '#FCE8E6',
    icon: PinterestIcon,
  },
  'google-analytics': {
    label: 'Google Analytics 4',
    color: '#E37400',
    bgColor: '#FEF3E2',
    icon: GA4Icon,
  },
  'search-console': {
    label: 'Search Console',
    color: '#34A853',
    bgColor: '#E6F4EA',
    icon: SearchConsoleIcon,
  },
};

interface PlatformPlaceholderProps {
  platform: string;
  section?: string;
}

export function PlatformPlaceholder({ platform, section }: PlatformPlaceholderProps) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return null;

  const Icon = config.icon;
  const title = section
    ? `${config.label} — ${section}`
    : config.label;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Icon size={20} />
          <h1 className="text-[22px] font-bold text-[#202124] tracking-tight">{title}</h1>
        </div>
        <p className="text-sm text-[#5F6368] mt-0.5">
          {section
            ? `${section} insights for ${config.label}`
            : `Overview of your ${config.label} account performance`}
        </p>
      </div>

      <div
        className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-24 gap-4"
        style={{ borderColor: config.color + '33', backgroundColor: config.bgColor + '66' }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon size={28} />
        </div>
        <div className="text-center">
          <div className="text-[15px] font-semibold text-[#202124] mb-1">{title}</div>
          <div className="text-[13px] text-[#5F6368]">
            Connect your {config.label} account to see data here.
          </div>
        </div>
        <button
          className="mt-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: config.color }}
        >
          Connect {config.label}
        </button>
      </div>
    </div>
  );
}
