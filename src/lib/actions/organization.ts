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

  // Check if user already has an org membership
  const { data: existing } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug, avatar_url, created_at')
      .eq('id', existing.organization_id)
      .single();
    return { organization: org as Organization, error: null };
  }

  // Build org name and slug from user metadata
  const fullName: string =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    '';
  const emailPrefix = user.email?.split('@')[0] ?? '';
  const displayName = fullName || emailPrefix;
  const orgName = `${displayName}'s Workspace`;
  const slug = generateSlug(displayName);

  // Insert organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: orgName, slug })
    .select('id, name, slug, avatar_url, created_at')
    .single();

  if (orgError || !org) {
    return {
      organization: null,
      error: orgError?.message ?? 'Failed to create organization',
    };
  }

  // Add user as owner (RLS: org_members_insert_first_owner allows this)
  const { error: memberError } = await supabase
    .from('org_members')
    .insert({ organization_id: org.id, user_id: user.id, role: 'owner' });

  if (memberError) {
    // Best-effort rollback
    await supabase.from('organizations').delete().eq('id', org.id);
    return { organization: null, error: memberError.message };
  }

  return { organization: org as Organization, error: null };
}
