'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#1A73E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M2 11l2.5-4 2.5 2 2-3.5 3 5.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
    <span style={{ fontWeight: 700, fontSize: 18, color: '#202124', letterSpacing: -0.3 }}>AdsPulse</span>
  </div>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 20 20" width="18" height="18">
    <path fill="#4285F4" d="M18.8 10.2c0-.65-.06-1.28-.17-1.88H10v3.56h4.94c-.21 1.14-.87 2.11-1.84 2.76v2.3h2.98c1.74-1.6 2.74-3.96 2.74-6.74z"/>
    <path fill="#34A853" d="M10 19c2.48 0 4.56-.82 6.08-2.22l-2.98-2.3c-.82.55-1.86.88-3.1.88-2.38 0-4.4-1.61-5.12-3.77H1.8v2.37C3.32 16.98 6.44 19 10 19z"/>
    <path fill="#FBBC05" d="M4.88 11.59A5.07 5.07 0 014.59 10c0-.55.1-1.09.29-1.59V5.04H1.8A9.01 9.01 0 001 10c0 1.45.35 2.82.97 4.04l2.9-2.45z"/>
    <path fill="#EA4335" d="M10 4.48c1.34 0 2.54.46 3.49 1.37l2.62-2.62C14.55 1.74 12.47 1 10 1 6.44 1 3.32 3.02 1.8 5.96l3.08 2.45c.72-2.16 2.74-3.93 5.12-3.93z"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // TODO: Supabase auth integration
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // TODO: Supabase magic link
    setTimeout(() => {
      setLoading(false);
      setMagicSent(true);
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // TODO: Supabase Google OAuth
    // setGoogleLoading(false) will be called after OAuth redirect or on error
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #F8F9FA; color: #202124; -webkit-font-smoothing: antialiased; }
        input { font-family: 'Inter', sans-serif; }
        input:focus { outline: none; }
        button { font-family: 'Inter', sans-serif; cursor: pointer; }
        a { color: #1A73E8; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F0F6FF 0%, #F8F9FA 60%)', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Logo />
          </button>
          <div style={{ fontSize: 13.5, color: '#5F6368' }}>
            Don&apos;t have an account?{' '}
            <button onClick={() => router.push('/register')} style={{ background: 'none', border: 'none', color: '#1A73E8', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign up
            </button>
          </div>
        </div>

        {/* Card */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 24px 60px' }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, border: '1px solid #E3E8EF', boxShadow: '0 4px 24px rgba(0,0,0,.06)', padding: '36px 40px' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#202124', letterSpacing: -0.5, marginBottom: 6 }}>Welcome back</h1>
              <p style={{ fontSize: 14, color: '#9AA0A6' }}>Sign in to your AdsPulse account</p>
            </div>

            {/* Google button */}
            <button onClick={handleGoogleLogin} disabled={googleLoading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px 16px', borderRadius: 9, border: '1.5px solid #E3E8EF', background: '#fff', fontSize: 14, fontWeight: 600, color: '#202124', transition: 'border-color .15s, box-shadow .15s', marginBottom: 20 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A73E8'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,115,232,.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E3E8EF'; e.currentTarget.style.boxShadow = 'none'; }}>
              <GoogleIcon />
              {googleLoading ? 'Redirecting...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: '#E3E8EF' }} />
              <span style={{ fontSize: 12, color: '#9AA0A6', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#E3E8EF' }} />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#F8F9FA', borderRadius: 8, padding: 3, marginBottom: 20 }}>
              {(['password', 'magic'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError(''); setMagicSent(false); }} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', background: tab === t ? '#fff' : 'transparent', fontSize: 13, fontWeight: 600, color: tab === t ? '#202124' : '#9AA0A6', transition: 'all .15s', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
                  {t === 'password' ? 'Password' : 'Magic link'}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Password form */}
            {tab === 'password' && (
              <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#202124', marginBottom: 6 }}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E3E8EF', fontSize: 14, color: '#202124', background: '#fff', transition: 'border-color .15s', boxSizing: 'border-box' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#1A73E8'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E3E8EF'; }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#202124' }}>Password</label>
                    <button type="button" style={{ background: 'none', border: 'none', fontSize: 12.5, color: '#1A73E8', fontWeight: 500 }}>Forgot password?</button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required
                      style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: 8, border: '1.5px solid #E3E8EF', fontSize: 14, color: '#202124', background: '#fff', transition: 'border-color .15s', boxSizing: 'border-box' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#1A73E8'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E3E8EF'; }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 4, color: '#9AA0A6' }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d={showPassword ? 'M3 3l10 10M6.5 6.5A2 2 0 0110 10M1 8s3-5 7-5 7 5 7 5-3 5-7 5c-1.3 0-2.5-.4-3.5-1' : 'M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z M10 8a2 2 0 11-4 0 2 2 0 014 0z'}/></svg>
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: loading ? '#93C5FD' : '#1A73E8', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'background .15s, transform .1s', marginTop: 4 }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1557B0'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1A73E8'; }}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            )}

            {/* Magic link form */}
            {tab === 'magic' && !magicSent && (
              <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#202124', marginBottom: 6 }}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E3E8EF', fontSize: 14, color: '#202124', background: '#fff', transition: 'border-color .15s', boxSizing: 'border-box' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#1A73E8'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E3E8EF'; }}
                  />
                </div>
                <p style={{ fontSize: 12.5, color: '#9AA0A6', lineHeight: 1.6 }}>
                  We&apos;ll send a magic link to your email. Click it to sign in instantly — no password needed.
                </p>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: loading ? '#93C5FD' : '#1A73E8', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'background .15s', marginTop: 4 }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1557B0'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1A73E8'; }}>
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
              </form>
            )}

            {/* Magic link sent */}
            {tab === 'magic' && magicSent && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📬</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#202124', marginBottom: 8 }}>Check your inbox</div>
                <p style={{ fontSize: 13.5, color: '#5F6368', lineHeight: 1.6, marginBottom: 20 }}>
                  We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
                </p>
                <button onClick={() => setMagicSent(false)} style={{ background: 'none', border: 'none', fontSize: 13, color: '#1A73E8', fontWeight: 500 }}>
                  Use a different email
                </button>
              </div>
            )}

            {/* Footer */}
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9AA0A6', marginTop: 24, lineHeight: 1.6 }}>
              By signing in, you agree to our{' '}
              <span style={{ color: '#1A73E8', cursor: 'pointer' }}>Terms of Service</span>
              {' '}and{' '}
              <span style={{ color: '#1A73E8', cursor: 'pointer' }}>Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
