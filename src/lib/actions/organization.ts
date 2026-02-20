'use server';

import { createClient } from '@/lib/supabase/server';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  created_at: string;
}

export interface OrgMembership {
  role: 'owner' | 'admin' | 'member' | 'viewer';
  organization: Organization;
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'org'}-${suffix}`;
}

export async function getUserOrganization(): Promise<OrgMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('org_members')
    .select('role, organizations(id, name, slug, avatar_url, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    role: data.role as OrgMembership['role'],
    organization: data.organizations as unknown as Organization,
  };
}

export async function createDefaultOrganization(): Promise<{
  organization: Organization | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { organization: null, error: 'Not authenticated' };

  // Build org name and slug from user metadata
  const fullName: string =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    '';
  const emailPrefix = user.email?.split('@')[0] ?? '';
  const displayName = fullName || emailPrefix;
  const orgName = `${displayName}'s Workspace`;
  const slug = generateSlug(displayName);

  // Atomically create org + owner membership via RPC.
  // The function checks for an existing org first (idempotent) and performs
  // org + member inserts in a single transaction — no rollback needed.
  const { data, error } = await supabase.rpc('create_default_organization', {
    p_name: orgName,
    p_slug: slug,
  });

  if (error) {
    return { organization: null, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { organization: null, error: 'Failed to create organization' };
  }

  return { organization: row as Organization, error: null };
}
