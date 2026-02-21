'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/components/providers/AuthProvider';
import {
  getUserProfile,
  updateDisplayName,
  rollbackDisplayName,
  updateAvatarUrl,
  type UserProfile,
} from '@/lib/actions/profile';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string | null, email: string): string {
  const src = name?.trim() || email;
  const parts = src.split(/[\s@]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfileTab
// ---------------------------------------------------------------------------

export function ProfileTab() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Display name
  const [nameValue, setNameValue] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isPendingName, startNameTransition] = useTransition();

  // Email
  const [emailValue, setEmailValue] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isPendingEmail, startEmailTransition] = useTransition();

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Load profile
  useEffect(() => {
    getUserProfile().then(({ data, error }) => {
      if (error) { setLoadError(error); return; }
      if (data) {
        setProfile(data);
        setNameValue(data.fullName ?? '');
        setEmailValue(data.email);
        setAvatarUrl(data.avatarUrl);
      }
    });
  }, []);

  // ── Save display name ──────────────────────────────────────────────────────
  function handleSaveName() {
    setNameError(null);
    setNameSaved(false);
    startNameTransition(async () => {
      const supabase = getBrowserSupabase();
      const trimmed = nameValue.trim();

      // Step 1: Update public.users first — if this fails, auth is untouched.
      const dbResult = await updateDisplayName(trimmed);
      if (dbResult.error) { setNameError(dbResult.error); return; }

      // Step 2: Update auth metadata only after DB succeeds.
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
      if (authError) {
        // Rollback the DB change to keep both stores in sync.
        // rollbackDisplayName accepts null/empty so a previously-null name
        // can be restored without triggering the public validation rules.
        const rollbackResult = await rollbackDisplayName(profile?.fullName ?? null);
        if (rollbackResult.error) {
          console.error('Rollback failed:', rollbackResult.error);
        }
        setNameError(authError.message);
        return;
      }

      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    });
  }

  // ── Send email change verification ────────────────────────────────────────
  function handleUpdateEmail() {
    setEmailError(null);
    setEmailSent(false);
    startEmailTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ email: emailValue.trim() });
      if (error) { setEmailError(error.message); return; }
      setEmailSent(true);
    });
  }

  // ── Avatar upload ──────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File must be under 5 MB');
      return;
    }

    setAvatarError(null);
    setUploading(true);

    try {
      const supabase = getBrowserSupabase();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) { setAvatarError(uploadError.message); return; }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

      const dbResult = await updateAvatarUrl(publicUrl);
      if (dbResult.error) { setAvatarError(dbResult.error); return; }

      setAvatarUrl(publicUrl);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected after an error
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (loadError) {
    return (
      <p className="text-sm text-red-600 py-4">{loadError}</p>
    );
  }

  const initials = getInitials(profile?.fullName ?? null, profile?.email ?? user?.email ?? '');

  return (
    <div className="space-y-4">

      {/* Avatar */}
      <Section title="Profile picture" description="JPG, PNG or GIF · max 5 MB">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="bg-[#E8F0FE] text-[#1A73E8] text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? 'Uploading…' : 'Change picture'}
            </Button>
            {avatarError && (
              <p className="text-xs text-red-600">{avatarError}</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </Section>

      {/* Display name */}
      <Section title="Display name">
        <div className="flex gap-2 max-w-sm">
          <Input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder="Your name"
            maxLength={100}
          />
          <Button
            onClick={handleSaveName}
            disabled={isPendingName || nameValue.trim() === (profile?.fullName ?? '')}
            size="sm"
            className="shrink-0"
          >
            {isPendingName ? 'Saving…' : nameSaved ? 'Saved ✓' : 'Save'}
          </Button>
        </div>
        {nameError && <p className="mt-1.5 text-xs text-red-600">{nameError}</p>}
      </Section>

      {/* Email */}
      <Section
        title="Email address"
        description="A verification email will be sent to the new address."
      >
        <div className="flex gap-2 max-w-sm">
          <Input
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder="you@example.com"
          />
          <Button
            onClick={handleUpdateEmail}
            disabled={
              isPendingEmail ||
              emailSent ||
              emailValue.trim() === profile?.email ||
              !emailValue.includes('@')
            }
            size="sm"
            className="shrink-0"
          >
            {isPendingEmail ? 'Sending…' : 'Update'}
          </Button>
        </div>
        {emailSent && (
          <p className="mt-1.5 text-xs text-green-700">
            Verification email sent — check your inbox to confirm the change.
          </p>
        )}
        {emailError && <p className="mt-1.5 text-xs text-red-600">{emailError}</p>}
      </Section>

      {/* Account info */}
      <Section title="Account">
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-gray-500">User ID</dt>
            <dd className="font-mono text-xs text-gray-700 break-all">{user?.id ?? '—'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-gray-500">Member since</dt>
            <dd className="text-gray-700">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })
                : '—'}
            </dd>
          </div>
        </dl>
      </Section>

    </div>
  );
}
