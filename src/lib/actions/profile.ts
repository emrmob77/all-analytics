'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from './organization';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// getUserProfile
// ---------------------------------------------------------------------------

export async function getUserProfile(): Promise<{
  data: UserProfile | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: 'Profile not found' };

  return {
    data: {
      id: data.id,
      email: data.email,
      fullName: (data as Record<string, unknown>).full_name as string | null,
      avatarUrl: (data as Record<string, unknown>).avatar_url as string | null,
      createdAt: (data as Record<string, unknown>).created_at as string,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// updateDisplayName — updates public.users (auth metadata updated client-side)
// ---------------------------------------------------------------------------

export async function updateDisplayName(
  fullName: string,
): Promise<{ error: string | null }> {
  const trimmed = fullName.trim();
  if (!trimmed || trimmed.length > 100)
    return { error: 'Name must be 1–100 characters' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('users')
    .update({ full_name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// updateAvatarUrl — persists the public storage URL into public.users
// ---------------------------------------------------------------------------

export async function updateAvatarUrl(
  url: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// updateOrganizationName — owner/admin only
// ---------------------------------------------------------------------------

export async function updateOrganizationName(
  name: string,
): Promise<{ error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100)
    return { error: 'Name must be 1–100 characters' };

  const supabase = await createClient();
  const membership = await getUserOrganization();
  if (!membership) return { error: 'No organization found' };
  if (!['owner', 'admin'].includes(membership.role))
    return { error: 'Only owners and admins can rename the organization' };

  const { error } = await supabase
    .from('organizations')
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', membership.organization.id);

  return { error: error?.message ?? null };
}
