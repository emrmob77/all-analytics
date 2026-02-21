'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useAuthContext } from '@/components/providers/AuthProvider';

// ---------------------------------------------------------------------------
// Init — runs once on the client
// ---------------------------------------------------------------------------

const POSTHOG_KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY  ?? '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host:             POSTHOG_HOST,
    person_profiles:      'identified_only',
    capture_pageview:     false, // we fire pageviews manually (see PageTracker)
    capture_pageleave:    true,
    autocapture:          true,
    session_recording:    { maskAllInputs: true },
    loaded: (ph) => {
      if (process.env.NODE_ENV !== 'production') ph.opt_out_capturing();
    },
  });
}

// ---------------------------------------------------------------------------
// Page view tracker — fires on every route change
// ---------------------------------------------------------------------------

function PageTracker() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [pathname, searchParams]);

  return null;
}

// ---------------------------------------------------------------------------
// User identifier — syncs auth user to PostHog
// ---------------------------------------------------------------------------

function UserIdentifier() {
  const { user } = useAuthContext();
  const identified = useRef(false);

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    if (user && !identified.current) {
      posthog.identify(user.id, {
        email:    user.email,
        name:     user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
      });
      identified.current = true;
    }

    if (!user && identified.current) {
      posthog.reset();
      identified.current = false;
    }
  }, [user]);

  return null;
}

// ---------------------------------------------------------------------------
// Provider export
// ---------------------------------------------------------------------------

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PageTracker />
      <UserIdentifier />
      {children}
    </PHProvider>
  );
}
