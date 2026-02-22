'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getAdAccounts, type AdAccount } from '@/lib/actions/ad-accounts';
import { OAuthConnector } from './OAuthConnector';
import type { AdPlatform } from '@/types';

// ---------------------------------------------------------------------------
// Analytics platform config (UI-only, coming soon)
// ---------------------------------------------------------------------------

interface AnalyticsPlatform {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const ANALYTICS_PLATFORMS: AnalyticsPlatform[] = [
  {
    id: 'google-analytics',
    label: 'Google Analytics 4',
    description: 'Sync sessions, conversions and engagement metrics from GA4.',
    comingSoon: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <rect x="2" y="13" width="5" height="9" rx="1.5" fill="#E37400" />
        <rect x="9.5" y="7" width="5" height="15" rx="1.5" fill="#FBBC04" />
        <rect x="17" y="2" width="5" height="20" rx="1.5" fill="#34A853" />
      </svg>
    ),
  },
  {
    id: 'search-console',
    label: 'Search Console',
    description: 'Import organic search impressions, clicks and top queries.',
    comingSoon: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <circle cx="10" cy="10" r="6.5" stroke="#4285F4" strokeWidth="2.2" />
        <path d="M15 15L21 21" stroke="#34A853" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M7.5 10h5M10 7.5v5" stroke="#4285F4" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

const AD_PLATFORMS: AdPlatform[] = ['google', 'meta', 'tiktok', 'pinterest'];

// ---------------------------------------------------------------------------
// Analytics connector card
// ---------------------------------------------------------------------------

function AnalyticsConnectorCard({ platform }: { platform: AnalyticsPlatform }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 bg-white rounded-xl border border-[#E3E8EF]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#FAFAFA] border border-[#E3E8EF]">
          {platform.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[#202124]">{platform.label}</p>
            {platform.comingSoon && (
              <span className="inline-flex items-center rounded-full bg-[#F1F3F4] px-2 py-0.5 text-[10px] font-semibold text-[#5F6368] uppercase tracking-wide">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-xs text-[#9AA0A6] mt-0.5">{platform.description}</p>
        </div>
      </div>

      <button
        disabled
        className="h-8 rounded-lg border border-[#E3E8EF] bg-[#F1F3F4] px-3 text-xs font-medium text-[#9AA0A6] cursor-not-allowed select-none shrink-0"
      >
        Connect
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConnectionsTab
// ---------------------------------------------------------------------------

interface ConnectionsTabProps {
  isAdmin: boolean;
}

export function ConnectionsTab({ isAdmin }: ConnectionsTabProps) {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAccounts() {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { accounts: data, error: err } = await getAdAccounts();
    if (err) setError(err);
    else setAccounts(data);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAccounts(); }, [isAdmin]);

  // Handle OAuth redirect result
  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauthError = searchParams.get('error');

    if (connected === 'true') {
      toast.success('Ad account connected successfully');
      const url = new URL(window.location.href);
      url.searchParams.delete('connected');
      window.history.replaceState(null, '', url.toString());
      loadAccounts();
    } else if (oauthError) {
      const messages: Record<string, string> = {
        oauth_failed: 'Failed to connect ad account. Please try again.',
        oauth_denied: 'Connection was cancelled.',
        invalid_platform: 'Invalid platform specified.',
      };
      toast.error(messages[oauthError] ?? 'An error occurred during connection.');
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState(null, '', url.toString());
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  function getAccountForPlatform(platform: AdPlatform): AdAccount | undefined {
    return accounts.find(a => a.platform === platform && a.is_active);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-[#9AA0A6]">
        Loading connections…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-[#C5221F]">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Ad Platforms */}
      <section>
        <div className="mb-4">
          <h2 className="text-[13.5px] font-semibold text-[#202124]">Ad Platforms</h2>
          <p className="text-[12.5px] text-[#5F6368] mt-0.5">
            Connect your advertising accounts to sync campaign data automatically.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {AD_PLATFORMS.map(platform => {
            const account = getAccountForPlatform(platform);
            return (
              <OAuthConnector
                key={platform}
                platform={platform}
                isConnected={!!account}
                accountName={account?.account_name}
                accountId={account?.id}
                isAdmin={isAdmin}
                onDisconnect={loadAccounts}
              />
            );
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[#E3E8EF]" />

      {/* Analytics & Tools */}
      <section>
        <div className="mb-4">
          <h2 className="text-[13.5px] font-semibold text-[#202124]">Analytics & Tools</h2>
          <p className="text-[12.5px] text-[#5F6368] mt-0.5">
            Bring in organic and website analytics alongside your paid data.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {ANALYTICS_PLATFORMS.map(platform => (
            <AnalyticsConnectorCard key={platform.id} platform={platform} />
          ))}
        </div>
      </section>

      {!isAdmin && (
        <p className="text-xs text-[#9AA0A6] text-center -mt-4">
          Only admins and owners can connect or disconnect integrations.
        </p>
      )}
    </div>
  );
}
