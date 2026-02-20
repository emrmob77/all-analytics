'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { acceptInvitation, getInvitationByToken } from '@/lib/actions/invitation';
import { useAuthContext } from '@/components/providers/AuthProvider';
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
  const [accepted, setAccepted] = useState(false);

  // Load invitation preview (org name, role, email)
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

  // Redirect unauthenticated users to login, preserving the accept URL
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
        setAccepted(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setAccepting(false);
    }
  };

  // Loading state
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

  // Invalid / expired token
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

  // Successfully accepted
  if (accepted) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1 style={headingStyle}>Welcome to {preview?.org_name}!</h1>
          <p style={{ fontSize: 14, color: '#5F6368', marginBottom: 8 }}>
            You&apos;ve joined as <strong>{ROLE_LABELS[preview?.role ?? ''] ?? preview?.role}</strong>.
          </p>
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
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
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
