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

// ---------------------------------------------------------------------------
// OrgMember — returned by getOrgMembers
// ---------------------------------------------------------------------------

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrgMember {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: OrgRole;
  joined_at: string;
}

// ---------------------------------------------------------------------------
// getOrgMembers — list all members of the caller's org (any member can call)
// ---------------------------------------------------------------------------

export async function getOrgMembers(): Promise<{
  members: OrgMember[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { members: [], error: 'Not authenticated' };

  const membership = await getUserOrganization();
  if (!membership) return { members: [], error: 'No organization found' };

  const { data, error } = await supabase.rpc('get_org_members', {
    p_org_id: membership.organization.id,
  });

  if (error) return { members: [], error: error.message };
  return { members: (data ?? []) as OrgMember[], error: null };
}

// ---------------------------------------------------------------------------
// removeOrgMember — admin/owner only; cannot remove self or the last owner
// ---------------------------------------------------------------------------

export async function removeOrgMember(
  targetUserId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const membership = await getUserOrganization();
  if (!membership) return { error: 'No organization found' };
  if (!['owner', 'admin'].includes(membership.role)) {
    return { error: 'Only owners and admins can remove members' };
  }
  if (targetUserId === user.id) {
    return { error: 'You cannot remove yourself' };
  }

  // Fetch the target member's current role to prevent removing an owner
  const { data: targetMember } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', membership.organization.id)
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (!targetMember) return { error: 'Member not found' };

  if (targetMember.role === 'owner') {
    return { error: 'Owners cannot be removed — transfer ownership first' };
  }

  const { error } = await supabase
    .from('org_members')
    .delete()
    .eq('organization_id', membership.organization.id)
    .eq('user_id', targetUserId);

  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// changeOrgMemberRole — owner only; cannot demote self or promote to owner
// ---------------------------------------------------------------------------

const ROLE_RANK: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
  viewer: 0,
};

export async function changeOrgMemberRole(
  targetUserId: string,
  newRole: OrgRole
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const membership = await getUserOrganization();
  if (!membership) return { error: 'No organization found' };
  if (membership.role !== 'owner') {
    return { error: 'Only owners can change member roles' };
  }
  if (targetUserId === user.id) {
    return { error: 'You cannot change your own role' };
  }
  if (newRole === 'owner') {
    return { error: 'Use the transfer ownership flow to assign the owner role' };
  }

  // Fetch target's current role
  const { data: targetMember } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', membership.organization.id)
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (!targetMember) return { error: 'Member not found' };
  if (targetMember.role === 'owner') {
    return { error: 'Cannot change another owner\'s role — transfer ownership first' };
  }

  if (ROLE_RANK[newRole] === ROLE_RANK[targetMember.role as OrgRole]) {
    return { error: null }; // no-op
  }

  const { error } = await supabase
    .from('org_members')
    .update({ role: newRole })
    .eq('organization_id', membership.organization.id)
    .eq('user_id', targetUserId);

  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// createDefaultOrganization
// ---------------------------------------------------------------------------

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
  const displayName = (fullName || emailPrefix).trim();
  const orgName = displayName ? `${displayName}'s Workspace` : 'My Workspace';
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
