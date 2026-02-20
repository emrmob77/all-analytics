'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useAuthContext } from '@/components/providers/AuthProvider';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface UseAuthReturn {
  user: ReturnType<typeof useAuthContext>['user'];
  session: ReturnType<typeof useAuthContext>['session'];
  loading: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>;
  signInWithEmail: (email: string, password: string, redirectTo?: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; emailConfirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
}

/** Validate a post-login redirect path to prevent open redirects. */
function safeRedirect(raw: string | null | undefined): string {
  if (!raw) return '/dashboard';
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';
}

export function useAuth(): UseAuthReturn {
  const { user, session, loading: authLoading } = useAuthContext();
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  const loading = authLoading || actionLoading;

  const signInWithGoogle = async (redirectTo?: string): Promise<{ error: string | null }> => {
    setActionLoading(true);
    const supabase = getSupabase();
    const next = safeRedirect(redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Thread `next` through the callback so the user lands on the right
        // page after OAuth completes (e.g. /invitations/accept?token=…).
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setActionLoading(false);
      return { error: error.message };
    }

    // On success the browser navigates away; loading intentionally stays true
    // until the redirect completes.
    return { error: null };
  };

  const signInWithEmail = async (
    email: string,
    password: string,
    redirectTo?: string
  ): Promise<{ error: string | null }> => {
    setActionLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setActionLoading(false);

    if (error) return { error: error.message };
    router.push(safeRedirect(redirectTo));
    return { error: null };
  };

  const signInWithMagicLink = async (
    email: string,
    redirectTo?: string
  ): Promise<{ error: string | null }> => {
    setActionLoading(true);
    const supabase = getSupabase();
    const next = safeRedirect(redirectTo);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setActionLoading(false);

    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: string | null; emailConfirmationRequired?: boolean }> => {
    setActionLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setActionLoading(false);

    if (error) return { error: error.message };

    // Email confirmation enabled: session is null until user confirms
    if (!data.session) {
      return { error: null, emailConfirmationRequired: true };
    }

    router.push('/dashboard');
    return { error: null };
  };

  const signOut = async () => {
    setActionLoading(true);
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setActionLoading(false);
    router.push('/login');
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signInWithMagicLink,
    signUp,
    signOut,
  };
}
