'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { acceptInvitation, getInvitationByToken } from '@/lib/actions/invitation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { InvitationPreview } from '@/lib/actions/invitation';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();

  const token = searchParams.get('token') ?? '';

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // 'idle' → 'accepted' → 'set_password' → 'done'
  const [step, setStep] = useState<'idle' | 'accepted' | 'set_password' | 'done'>('idle');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Load invitation preview
  useEffect(() => {
    if (!token) {
      setPreviewError('Missing invitation token.');
      return;
    }
    getInvitationByToken(token).then(({ preview, error }) => {
      if (error) setPreviewError(error);
      else setPreview(preview);
    });
  }, [token]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      const next = encodeURIComponent(`/invitations/accept?token=${token}`);
      router.push(`/login?next=${next}`);
    }
  }, [authLoading, user, token, router]);

  const handleAccept = async () => {
    setAccepting(true);
    setAcceptError(null);
    try {
      const { error } = await acceptInvitation(token);
      if (error) {
        setAcceptError(error);
      } else {
        setStep('accepted');
        // Small delay then move to password step
        setTimeout(() => setStep('set_password'), 1200);
      }
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setAccepting(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setStep('done');
      setTimeout(() => router.push('/dashboard'), 1500);
    }
  };

  const handleSkipPassword = () => {
    setStep('done');
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  // Loading
  if (authLoading || (!preview && !previewError)) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
          <p style={{ fontSize: 14, color: '#5F6368' }}>Loading invitation…</p>
        </div>
      </div>
    );
  }

  // Invalid / expired
  if (previewError) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
          <h1 style={headingStyle}>Invalid invitation</h1>
          <p style={{ fontSize: 14, color: '#5F6368', marginBottom: 24 }}>{previewError}</p>
          <button onClick={() => router.push('/')} style={linkButtonStyle}>
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  // Step: accepted (brief success flash)
  if (step === 'accepted') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1 style={headingStyle}>Welcome to {preview?.org_name}!</h1>
          <p style={{ fontSize: 14, color: '#5F6368' }}>
            You&apos;ve joined as <strong>{ROLE_LABELS[preview?.role ?? ''] ?? preview?.role}</strong>.
          </p>
        </div>
      </div>
    );
  }

  // Step: set password
  if (step === 'set_password') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1A73E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M2 10l2.5-4 2.5 2.5 2-3.5 3 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: '#202124' }}>AdsPulse</span>
          </div>

          <h1 style={headingStyle}>Set your password</h1>
          <p style={{ fontSize: 14, color: '#5F6368', marginBottom: 24, lineHeight: 1.6 }}>
            Create a password so you can sign in with email next time.
          </p>

          <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#202124', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E3E8EF', fontSize: 14, color: '#202124', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1A73E8'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E3E8EF'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#202124', marginBottom: 6 }}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E3E8EF', fontSize: 14, color: '#202124', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1A73E8'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E3E8EF'; }}
              />
            </div>

            {passwordError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: savingPassword ? '#93C5FD' : '#1A73E8', color: '#fff', fontSize: 14, fontWeight: 700, cursor: savingPassword ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4 }}
            >
              {savingPassword ? 'Saving…' : 'Set password & go to dashboard →'}
            </button>
          </form>

          <button onClick={handleSkipPassword} style={{ ...linkButtonStyle, display: 'block', marginTop: 16, width: '100%', textAlign: 'center' }}>
            Skip for now — I&apos;ll use magic link
          </button>
        </div>
      </div>
    );
  }

  // Step: done
  if (step === 'done') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>✅</div>
          <h1 style={headingStyle}>All set!</h1>
          <p style={{ fontSize: 13, color: '#9AA0A6' }}>Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  // Main accept UI
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1A73E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M2 10l2.5-4 2.5 2.5 2-3.5 3 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#202124' }}>AdsPulse</span>
        </div>

        <h1 style={headingStyle}>You&apos;ve been invited!</h1>
        <p style={{ fontSize: 14, color: '#5F6368', marginBottom: 24, lineHeight: 1.6 }}>
          You&apos;ve been invited to join{' '}
          <strong style={{ color: '#202124' }}>{preview?.org_name}</strong> as a{' '}
          <strong style={{ color: '#202124' }}>{ROLE_LABELS[preview?.role ?? ''] ?? preview?.role}</strong>.
        </p>

        {/* Info row */}
        <div style={{ background: '#F8F9FA', border: '1px solid #E3E8EF', borderRadius: 9, padding: '12px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#9AA0A6', marginBottom: 4 }}>Invited email</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#202124' }}>{preview?.email}</div>
        </div>

        {acceptError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
            {acceptError}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={accepting}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: 9,
            border: 'none',
            background: accepting ? '#93C5FD' : '#1A73E8',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: accepting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            marginBottom: 12,
          }}
        >
          {accepting ? 'Joining…' : 'Accept invitation →'}
        </button>

        <button onClick={() => router.push('/')} style={linkButtonStyle}>
          Decline
        </button>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: 14, color: '#5F6368' }}>Loading invitation…</p>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #F0F6FF 0%, #F8F9FA 60%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-inter), Inter, -apple-system, sans-serif',
  padding: '24px',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 440,
  background: '#fff',
  borderRadius: 16,
  border: '1px solid #E3E8EF',
  boxShadow: '0 4px 24px rgba(0,0,0,.06)',
  padding: '36px 40px',
  textAlign: 'center',
};

const headingStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: '#202124',
  letterSpacing: -0.5,
  marginBottom: 8,
};

const linkButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 13,
  color: '#9AA0A6',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
