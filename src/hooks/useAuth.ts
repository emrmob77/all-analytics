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
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { user, session, loading: authLoading } = useAuthContext();
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  const loading = authLoading || actionLoading;

  const signInWithGoogle = async () => {
    setActionLoading(true);
    const supabase = getSupabase();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // Redirect handled by OAuth flow; loading stays true until navigation
  };

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    setActionLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setActionLoading(false);

    if (error) return { error: error.message };
    router.push('/dashboard');
    return { error: null };
  };

  const signInWithMagicLink = async (
    email: string
  ): Promise<{ error: string | null }> => {
    setActionLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setActionLoading(false);

    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: string | null }> => {
    setActionLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setActionLoading(false);

    if (error) return { error: error.message };
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
