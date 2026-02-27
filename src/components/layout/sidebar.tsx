'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { cn } from '@/lib/utils';
import {
  GoogleIcon,
  MetaIcon,
  TikTokIcon,
  PinterestIcon,
  GA4Icon,
  SearchConsoleIcon,
} from '@/components/ui/platform-icons';
import { useUser } from '@/hooks/useUser';
import { useOrganization } from '@/hooks/useOrganization';
import { getCampaignCount } from '@/lib/actions/campaigns';
import { getConnectedGoogleAdsAccount, fetchGoogleChildAccounts, updateActiveGoogleAdsView, type GoogleChildAccount } from '@/lib/actions/google-ads';
import { toast } from 'sonner';

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

interface PlatformGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  basePath: string;
  items: { label: string; href: string }[];
}

const PLATFORM_GROUPS: PlatformGroup[] = [
  {
    id: 'google-ads',
    label: 'Google Ads',
    icon: GoogleIcon,
    basePath: '/google-ads',
    items: [
      { label: 'Overview', href: '/google-ads' },
      { label: 'Search', href: '/google-ads/search' },
      { label: 'Display', href: '/google-ads/display' },
      { label: 'Demand Gen', href: '/google-ads/demand-gen' },
      { label: 'Shopping', href: '/google-ads/shopping' },
      { label: 'Performance Max', href: '/google-ads/performance-max' },
      { label: 'Video', href: '/google-ads/video' },
      { label: 'App', href: '/google-ads/app' },
    ],
  },
  {
    id: 'meta-ads',
    label: 'Meta Ads',
    icon: MetaIcon,
    basePath: '/meta-ads',
    items: [
      { label: 'Overview', href: '/meta-ads' },
      { label: 'Campaign Type', href: '/meta-ads/campaign-type' },
      { label: 'Creative Performance', href: '/meta-ads/creative-performance' },
      { label: 'Catalog Sets', href: '/meta-ads/catalog-sets' },
      { label: 'Audiences', href: '/meta-ads/audiences' },
    ],
  },
  {
    id: 'tiktok-ads',
    label: 'TikTok Ads',
    icon: TikTokIcon,
    basePath: '/tiktok-ads',
    items: [
      { label: 'Overview', href: '/tiktok-ads' },
      { label: 'Campaigns', href: '/tiktok-ads/campaigns' },
      { label: 'Ad Groups', href: '/tiktok-ads/ad-groups' },
      { label: 'Creatives', href: '/tiktok-ads/creatives' },
      { label: 'Audiences', href: '/tiktok-ads/audiences' },
    ],
  },
  {
    id: 'pinterest-ads',
    label: 'Pinterest Ads',
    icon: PinterestIcon,
    basePath: '/pinterest-ads',
    items: [
      { label: 'Overview', href: '/pinterest-ads' },
      { label: 'Campaigns', href: '/pinterest-ads/campaigns' },
      { label: 'Ad Groups', href: '/pinterest-ads/ad-groups' },
      { label: 'Pins', href: '/pinterest-ads/pins' },
      { label: 'Audiences', href: '/pinterest-ads/audiences' },
    ],
  },
  {
    id: 'google-analytics',
    label: 'Google Analytics 4',
    icon: GA4Icon,
    basePath: '/google-analytics',
    items: [
      { label: 'Overview', href: '/google-analytics' },
      { label: 'Acquisition', href: '/google-analytics/acquisition' },
      { label: 'Engagement', href: '/google-analytics/engagement' },
      { label: 'Monetization', href: '/google-analytics/monetization' },
      { label: 'Reports', href: '/google-analytics/reports' },
    ],
  },
  {
    id: 'search-console',
    label: 'Search Console',
    icon: SearchConsoleIcon,
    basePath: '/search-console',
    items: [
      { label: 'Overview', href: '/search-console' },
      { label: 'Performance', href: '/search-console/performance' },
      { label: 'Coverage', href: '/search-console/coverage' },
      { label: 'Sitemaps', href: '/search-console/sitemaps' },
    ],
  },
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
  const [openPlatforms, setOpenPlatforms] = useState<Record<string, boolean>>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  const activePlatformGroupId = useMemo(
    () =>
      PLATFORM_GROUPS.find(
        (g) => pathname === g.basePath || pathname?.startsWith(g.basePath + '/')
      )?.id,
    [pathname]
  );

  const [googleAdAccount, setGoogleAdAccount] = useState<{
    id: string;
    selected_child_account_id: string | null;
    selected_child_accounts: Array<string | GoogleChildAccount> | null;
  } | null>(null);
  const [googleChildren, setGoogleChildren] = useState<GoogleChildAccount[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Fetch connected Google Ads account when sidebar loads
  useEffect(() => {
    let mounted = true;
    if (organization) {
      getConnectedGoogleAdsAccount().then((acc) => {
        if (mounted && acc) {
          setGoogleAdAccount(acc);

          // Only fetch child accounts if setup is complete
          if (acc.selected_child_accounts && acc.selected_child_accounts.length > 0) {
            fetchGoogleChildAccounts(acc.id).then(children => {
              if (mounted) setGoogleChildren(children);
            });
          }
        }
      });
    }
    return () => { mounted = false; };
  }, [organization]);

  const handleSwitchChild = async (childId: string) => {
    if (!googleAdAccount) return;
    try {
      if (googleAdAccount.selected_child_account_id === childId) return;

      setIsSwitching(true);
      toast.loading('Switching active view...', { id: 'switch-account' });

      await updateActiveGoogleAdsView(googleAdAccount.id, childId);
      setGoogleAdAccount({ ...googleAdAccount, selected_child_account_id: childId });

      toast.success('Active view changed.', { id: 'switch-account' });

      // Hard refresh to immediately render with new account context
      router.refresh();

    } catch (err) {
      toast.error('Failed to switch ad account', { id: 'switch-account' });
      console.error(err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    router.push('/login');
  };

  const togglePlatform = (id: string) => {
    setOpenPlatforms((prev) => {
      const current = prev[id] ?? id === activePlatformGroupId;
      return { ...prev, [id]: !current };
    });
  };

  const { data: campaignCount } = useQuery<number>({
    queryKey: ['campaign-count'],
    queryFn: () => getCampaignCount(),
    staleTime: 60_000,
  });

  const activeChildId = googleAdAccount?.selected_child_account_id;

  // Filter only the selected accounts that are explicitly connected
  const selectedChildren = (googleAdAccount?.selected_child_accounts || [])
    .map((childOrId: string | GoogleChildAccount) => {
      const base = typeof childOrId === 'string'
        ? { id: childOrId, name: `Account ${childOrId}`, kind: 'client' as const }
        : (childOrId as GoogleChildAccount);

      // Prefer live account metadata from Google API (name/kind),
      // so old stored placeholders like "Account 123..." are replaced.
      const live = googleChildren.find((child) => child.id === base.id);
      return live ? { ...base, ...live } : base;
    })
    // Sidebar switcher should stay campaign-view friendly; MCC entries are still selectable in Settings.
    .filter((child: GoogleChildAccount) => child.kind !== 'manager');

  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-[#E3E8EF] bg-[#FAFAFA]">
      {/* Logo */}
      <div className="flex items-center gap-2 px-[18px] pt-[18px] pb-[12px]">
        <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#1A73E8]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10l2.5-4 2.5 2.5 2-3.5 3 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-[15px] font-bold text-[#202124]">AdsPulse</span>
      </div>

      {/* Account Switcher Options / Dropdown */}
      <div className="px-3 mb-[14px]">
        {/* We can make this a dropdown if we want org switching, but currently it's just displaying Org */}
        <div className="flex items-center gap-[9px] rounded-[9px] border border-[#E3E8EF] bg-white p-[9px_11px]">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#FBBC05] text-xs font-bold text-white shrink-0">
            {organization ? getInitials(organization.name) : '…'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-[12.5px] font-semibold text-[#202124]">
              {organization?.name ?? 'Loading…'}
            </div>
            <div className="text-[10.5px] text-[#9AA0A6] capitalize">{role ?? ''}</div>
          </div>
        </div>

        {/* Google Ads Sub-Account Switcher (Open List style) */}
        {googleAdAccount && selectedChildren.length > 0 && (
          <div className="mt-2.5">
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#9AA0A6] uppercase tracking-wider">
                Google Ads Accounts
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {selectedChildren.map((child: GoogleChildAccount) => {
                const isActive = activeChildId === child.id || (!activeChildId && selectedChildren[0].id === child.id);
                return (
                  <button
                    key={child.id}
                    onClick={() => handleSwitchChild(child.id)}
                    disabled={isSwitching}
                    title={child.id}
                    className={cn(
                      "group flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-[9px] transition-all",
                      isActive
                        ? "bg-[#E8F0FE] text-[#1A73E8]"
                        : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center shrink-0 w-5 h-5 rounded-[5px] transition-colors",
                      isActive ? "bg-white shadow-sm" : "bg-[#F1F3F4] group-hover:bg-white group-hover:shadow-sm"
                    )}>
                      <GoogleIcon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "truncate text-[12px]",
                        isActive ? "font-semibold" : "font-medium"
                      )}>
                        {child.name}
                      </div>
                    </div>
                    {isActive && (
                      <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#1A73E8]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Warning Banner if connected but setup incomplete */}
        {googleAdAccount && (!googleAdAccount.selected_child_accounts || googleAdAccount.selected_child_accounts.length === 0) && (
          <Link href="/settings?tab=connections&action_required=true" className="mt-2 block text-left w-full rounded-[9px] border border-orange-200 bg-orange-50 p-[9px_11px] transition-colors hover:bg-orange-100 focus:outline-none">
            <div className="flex items-center gap-2 min-w-0">
              <GoogleIcon size={14} />
              <div className="flex-1 min-w-0">
                <div className="truncate text-[11px] font-bold text-orange-800 uppercase tracking-wide">
                  Action Required
                </div>
                <div className="text-[11.5px] font-medium text-orange-700 leading-tight mt-0.5">
                  Select Google Ads account in Settings to start.
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-[10px]">
        {/* Main Menu */}
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

        {/* Platforms Section */}
        <div className="mt-4 mb-2 px-2 text-[9.5px] font-semibold uppercase tracking-[1px] text-[#9AA0A6]">
          Platforms
        </div>
        <nav className="space-y-[1px]">
          {PLATFORM_GROUPS.map((group) => {
            const Icon = group.icon;
            const isOpen = openPlatforms[group.id] ?? group.id === activePlatformGroupId;
            const isGroupActive =
              pathname === group.basePath || pathname?.startsWith(group.basePath + '/');

            return (
              <div key={group.id}>
                {/* Group header button */}
                <button
                  onClick={() => togglePlatform(group.id)}
                  className={cn(
                    'flex w-full items-center gap-[9px] rounded-lg px-[10px] py-[7px] text-[13px] transition-all duration-150',
                    isGroupActive && !isOpen
                      ? 'border border-[#D2E3FC] bg-[#E8F0FE] font-semibold text-[#1A73E8]'
                      : 'border border-transparent text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]'
                  )}
                >
                  <Icon size={13} />
                  <span className="flex-1 text-left">{group.label}</span>
                  <svg
                    width="10"
                    height="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    className={cn('shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
                  >
                    <path d="M1.5 3l3.5 3.5L8.5 3" />
                  </svg>
                </button>

                {/* Sub-items */}
                {isOpen && (
                  <div className="ml-[10px] mt-[1px] space-y-[1px] border-l border-[#E3E8EF] pl-[10px]">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== group.basePath && pathname?.startsWith(item.href + '/'));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center rounded-md px-[8px] py-[5px] text-[12px] transition-all duration-150',
                            isActive
                              ? 'bg-[#E8F0FE] font-semibold text-[#1A73E8]'
                              : 'text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]'
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="5" r="2.5" /><path d="M1 13c0-3.3 2.7-5 6-5s6 1.7 6 5" /></svg>
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#202124] hover:bg-[#F1F3F4] transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="2.5" /><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1 1M9.4 9.4l1 1M2.6 11.4l1-1M9.4 4.6l1-1" /></svg>
              Settings
            </Link>
            <div className="border-t border-[#F1F3F4] mx-2" />
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-[#C5221F] hover:bg-[#FEF3F2] transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2H4a1 1 0 00-1 1v8a1 1 0 001 1h5M11 9l3-3-3-3M14 6H6" /></svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
