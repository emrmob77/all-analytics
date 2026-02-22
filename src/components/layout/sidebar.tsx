'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
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
  { id: 'budget', label: 'Budget', href: '/budget' },
  { id: 'billing', label: 'Billing', href: '/billing' },
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
  const router = useRouter();
  const user = useUser();
  const { organization, role } = useOrganization();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    router.push('/login');
  };

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
                role="img"
                aria-label={p.label}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border border-[#E3E8EF] bg-white transition-colors hover:bg-gray-50"
              >
                <Icon size={14} aria-hidden />
              </div>
            );
          })}
        </div>
      </div>

      {/* User */}
      <div ref={userMenuRef} className="relative border-t border-[#E3E8EF]">
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          className="flex w-full items-center gap-[10px] px-4 py-3 hover:bg-[#F1F3F4] transition-colors text-left"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-[11px] font-bold text-white">
              {user ? getInitials(user.fullName) : '…'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="truncate text-[12.5px] font-semibold text-[#202124]">
              {user?.fullName ?? 'Loading…'}
            </div>
            <div className="truncate text-[10.5px] text-[#9AA0A6]">{user?.email ?? ''}</div>
          </div>
          <svg width="12" height="12" fill="none" stroke="#9AA0A6" strokeWidth="1.5" strokeLinecap="round" className="shrink-0">
            <path d={userMenuOpen ? 'M2 8l4-4 4 4' : 'M2 4l4 4 4-4'} />
          </svg>
        </button>

        {userMenuOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-1 rounded-[10px] border border-[#E3E8EF] bg-white shadow-lg overflow-hidden z-50">
            <Link
              href="/settings?tab=profile"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#202124] hover:bg-[#F1F3F4] transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="5" r="2.5"/><path d="M1 13c0-3.3 2.7-5 6-5s6 1.7 6 5"/></svg>
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#202124] hover:bg-[#F1F3F4] transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="2.5"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1 1M9.4 9.4l1 1M2.6 11.4l1-1M9.4 4.6l1-1"/></svg>
              Settings
            </Link>
            <div className="border-t border-[#F1F3F4] mx-2" />
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-[#C5221F] hover:bg-[#FEF3F2] transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2H4a1 1 0 00-1 1v8a1 1 0 001 1h5M11 9l3-3-3-3M14 6H6"/></svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
