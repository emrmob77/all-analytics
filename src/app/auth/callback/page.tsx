'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Suspense } from 'react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const next = searchParams.get('next') ?? '/dashboard';

    // Handle PKCE code flow (signup confirmation, password reset, magic link)
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          router.replace(`/login?error=auth_callback_failed&reason=${encodeURIComponent(error.message)}`);
        } else {
          router.replace(next);
        }
      });
      return;
    }

    // Handle implicit hash flow (inviteUserByEmail returns #access_token=...)
    // The hash is not available on the server, but onAuthStateChange picks it up
    // automatically in the browser via the Supabase client.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        router.replace(next);
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // ignore
      }
    });

    // Fallback: if no code and no hash tokens arrive within 5 s, redirect to login
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      router.replace('/login?error=auth_callback_failed&reason=no_code');
    }, 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [router, searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-inter), Inter, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #F0F6FF 0%, #F8F9FA 60%)',
    }}>
      <div style={{
        textAlign: 'center',
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #E3E8EF',
        boxShadow: '0 4px 24px rgba(0,0,0,.06)',
        padding: '40px 48px',
      }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
        <p style={{ fontSize: 14, color: '#5F6368', margin: 0 }}>Signing you in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-inter), Inter, -apple-system, sans-serif',
      }}>
        <p style={{ fontSize: 14, color: '#5F6368' }}>Loading…</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
