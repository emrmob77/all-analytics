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

    // PKCE flow: signup confirm, password reset, magic link
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          router.replace(
            `/login?error=auth_callback_failed&reason=${encodeURIComponent(error.message)}`
          );
        } else {
          router.replace(next);
        }
      });
      return;
    }

    // Implicit hash flow: inviteUserByEmail returns #access_token=...
    // Parse hash manually — window.location.hash is only available client-side
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            router.replace(
              `/login?error=auth_callback_failed&reason=${encodeURIComponent(error.message)}`
            );
          } else {
            router.replace(next);
          }
        });
      return;
    }

    // No tokens at all → back to login
    router.replace('/login?error=auth_callback_failed&reason=no_code');
  }, [router, searchParams]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-inter), Inter, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #F0F6FF 0%, #F8F9FA 60%)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E3E8EF',
          boxShadow: '0 4px 24px rgba(0,0,0,.06)',
          padding: '40px 48px',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
        <p style={{ fontSize: 14, color: '#5F6368', margin: 0 }}>Signing you in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ fontSize: 14, color: '#5F6368' }}>Loading…</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
