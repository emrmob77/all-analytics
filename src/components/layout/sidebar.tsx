'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { GoogleIcon, MetaIcon, TikTokIcon, PinterestIcon } from '@/components/ui/platform-icons';
import { useUser } from '@/hooks/useUser';
import { useOrganization } from '@/hooks/useOrganization';
import { getCampaignCount } from '@/lib/actions/campaigns';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard' },
  { id: 'campaigns', label: 'Campaigns', href: '/campaigns' },
  { id: 'adgroups', label: 'Ad Groups', href: '/adgroups' },
  { id: 'audiences', label: 'Audiences', href: '/audiences' },
  { id: 'keywords', label: 'Keywords', href: '/keywords' },
  { id: 'creatives', label: 'Ads & Creatives', href: '/creatives' },
  { id: 'budget', label: 'Budget & Billing', href: '/budget' },
  { id: 'reports', label: 'Reports', href: '/reports' },
  { id: 'settings', label: 'Settings', href: '/settings' },
];

const CONNECTED_PLATFORMS = [
  { id: 'google', label: 'Google Ads', icon: GoogleIcon },
  { id: 'meta', label: 'Meta Ads', icon: MetaIcon },
  { id: 'tiktok', label: 'TikTok Ads', icon: TikTokIcon },
  { id: 'pinterest', label: 'Pinterest', icon: PinterestIcon },
];

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase() || '?';
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useUser();
  const { organization, role } = useOrganization();

  const { data: campaignCount } = useQuery<number>({
    queryKey: ['campaign-count'],
    queryFn: () => getCampaignCount(),
    staleTime: 60_000,
  });

  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-[#E3E8EF] bg-[#FAFAFA]">
      {/* Logo */}
      <div className="flex items-center gap-2 px-[18px] pt-[18px] pb-[12px]">
        <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#1A73E8]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10l2.5-4 2.5 2.5 2-3.5 3 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-[15px] font-bold text-[#202124]">AdsPulse</span>
      </div>

      {/* Account Switcher */}
      <div className="mx-3 mb-[14px] flex cursor-pointer items-center gap-[9px] rounded-[9px] border border-[#E3E8EF] bg-white p-[9px_11px]">
        <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#FBBC05] text-xs font-bold text-white">
          {organization ? getInitials(organization.name) : '…'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-[12.5px] font-semibold text-[#202124]">
            {organization?.name ?? 'Loading…'}
          </div>
          <div className="text-[10.5px] text-[#9AA0A6] capitalize">{role ?? ''}</div>
        </div>
        <svg width="12" height="12" fill="none" stroke="#9AA0A6" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4l4 4 4-4"/>
        </svg>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-[10px]">
        <div className="mb-2 px-2 text-[9.5px] font-semibold uppercase tracking-[1px] text-[#9AA0A6]">
          Menu
        </div>
        <nav className="space-y-[1px]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const badge = item.id === 'campaigns' && campaignCount ? campaignCount : null;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-[9px] rounded-lg px-[10px] py-[7px] text-[13px] transition-all duration-150',
                  isActive
                    ? 'border border-[#D2E3FC] bg-[#E8F0FE] font-semibold text-[#1A73E8]'
                    : 'border border-transparent text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]'
                )}
              >
                <span className="flex-1">{item.label}</span>
                {badge && (
                  <span
                    className={cn(
                      'rounded px-1.5 py-[1px] text-[10px] font-bold',
                      isActive ? 'bg-[#1A73E8] text-white' : 'bg-[#E3E8EF] text-[#5F6368]'
                    )}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Connected Platforms */}
      <div className="border-t border-[#E3E8EF] px-4 py-3">
        <div className="mb-2 text-[9.5px] font-semibold uppercase tracking-[1px] text-[#9AA0A6]">
          Connected
        </div>
        <div className="flex gap-1.5">
          {CONNECTED_PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                title={p.label}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border border-[#E3E8EF] bg-white transition-colors hover:bg-gray-50"
              >
                <Icon size={14} />
              </div>
            );
          })}
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-[10px] border-t border-[#E3E8EF] px-4 py-3">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.fullName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A73E8] text-[11px] font-bold text-white">
            {user ? getInitials(user.fullName) : '…'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="truncate text-[12.5px] font-semibold text-[#202124]">
            {user?.fullName ?? 'Loading…'}
          </div>
          <div className="truncate text-[10.5px] text-[#9AA0A6]">{user?.email ?? ''}</div>
        </div>
      </div>
    </aside>
  );
}
