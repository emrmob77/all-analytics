'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { initiateOAuth, disconnectAdAccount } from '@/lib/actions/ad-accounts';
import type { AdPlatform } from '@/types';

// ---------------------------------------------------------------------------
// Platform metadata
// ---------------------------------------------------------------------------

const PLATFORM_META: Record<
  AdPlatform,
  { label: string; color: string; icon: React.ReactNode }
> = {
  google: {
    label: 'Google Ads',
    color: 'text-[#4285F4]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  meta: {
    label: 'Meta Ads',
    color: 'text-[#1877F2]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  tiktok: {
    label: 'TikTok Ads',
    color: 'text-[#010101]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#010101">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z" />
      </svg>
    ),
  },
  pinterest: {
    label: 'Pinterest Ads',
    color: 'text-[#E60023]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#E60023">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
  },
};

// ---------------------------------------------------------------------------
// OAuthConnector
// ---------------------------------------------------------------------------

interface OAuthConnectorProps {
  platform: AdPlatform;
  isConnected: boolean;
  accountName?: string;
  accountId?: string;
  isAdmin: boolean;
  onDisconnect: () => void;
}

export function OAuthConnector({
  platform,
  isConnected,
  accountName,
  accountId,
  isAdmin,
  onDisconnect,
}: OAuthConnectorProps) {
  const [isPending, startTransition] = useTransition();
  const meta = PLATFORM_META[platform];

  function handleConnect() {
    startTransition(async () => {
      const { authUrl, error } = await initiateOAuth(platform);
      if (error || !authUrl) {
        console.error('OAuth initiation error:', error);
        return;
      }
      window.location.href = authUrl;
    });
  }

  function handleDisconnect() {
    if (!accountId) return;
    startTransition(async () => {
      const { error } = await disconnectAdAccount(accountId);
      if (!error) onDisconnect();
    });
  }

  return (
    <div className="flex items-center justify-between px-4 py-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
          {meta.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{meta.label}</p>
          {isConnected && accountName ? (
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
              {accountName}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Not connected</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isConnected ? (
          <>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5 font-medium">
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Connected
            </span>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isPending}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 h-8 text-xs"
              >
                {isPending ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            )}
          </>
        ) : (
          isAdmin && (
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={isPending}
              className="h-8 text-xs"
            >
              {isPending ? 'Connecting…' : `Connect ${meta.label}`}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
