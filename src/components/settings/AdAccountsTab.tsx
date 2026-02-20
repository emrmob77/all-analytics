'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getAdAccounts, type AdAccount } from '@/lib/actions/ad-accounts';
import { OAuthConnector } from './OAuthConnector';
import type { AdPlatform } from '@/types';

const AD_PLATFORMS: AdPlatform[] = ['google', 'meta', 'tiktok', 'pinterest'];

interface AdAccountsTabProps {
  isAdmin: boolean;
}

export function AdAccountsTab({ isAdmin }: AdAccountsTabProps) {
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

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadAccounts(); }, [isAdmin]);

  // Show toast based on URL params after OAuth redirect
  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauthError = searchParams.get('error');

    if (connected === 'true') {
      toast.success('Ad account connected successfully');
      const url = new URL(window.location.href);
      url.searchParams.delete('connected');
      window.history.replaceState(null, '', url.toString());
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        Loading ad accounts…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-red-500">
        {error}
      </div>
    );
  }

  function getAccountForPlatform(platform: AdPlatform): AdAccount | undefined {
    return accounts.find(a => a.platform === platform && a.is_active);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Ad Account Connections</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect your advertising accounts to sync campaign data.
        </p>
      </div>

      <div className="flex flex-col gap-3">
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

      {!isAdmin && (
        <p className="text-xs text-gray-400 text-center">
          Only admins and owners can connect or disconnect ad accounts.
        </p>
      )}
    </div>
  );
}
