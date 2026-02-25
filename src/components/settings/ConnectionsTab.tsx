'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getAdAccounts, type AdAccount } from '@/lib/actions/ad-accounts';
import { triggerManualSync } from '@/lib/actions/sync';
import { OAuthConnector } from './OAuthConnector';
import type { AdPlatform } from '@/types';

const AD_PLATFORMS: AdPlatform[] = ['google', 'meta', 'tiktok', 'pinterest'];
const ANALYTICS_PLATFORMS: AdPlatform[] = ['google-analytics', 'search-console'];

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
  const [isSyncing, startSync] = useTransition();

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

  const hasConnectedAccount = accounts.some(a => a.is_active);

  function handleSyncNow() {
    startSync(async () => {
      const { error: syncErr } = await triggerManualSync();
      if (syncErr) {
        toast.error(syncErr);
      } else {
        toast.success('Sync started — data will appear shortly.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Ad Platforms */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[13.5px] font-semibold text-[#202124]">Ad Platforms</h2>
            <p className="text-[12.5px] text-[#5F6368] mt-0.5">
              Connect your advertising accounts to sync campaign data automatically.
            </p>
          </div>
          {isAdmin && hasConnectedAccount && (
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#E3E8EF] bg-white px-3 py-1.5 text-xs font-medium text-[#202124] hover:bg-[#F8F9FA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} viewBox="0 0 16 16" fill="none">
                <path d="M13.5 8A5.5 5.5 0 112.5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M13.5 4v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isSyncing ? 'Syncing…' : 'Sync Now'}
            </button>
          )}
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
          {ANALYTICS_PLATFORMS.map(platform => {
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

      {!isAdmin && (
        <p className="text-xs text-[#9AA0A6] text-center -mt-4">
          Only admins and owners can connect or disconnect integrations.
        </p>
      )}
    </div>
  );
}
