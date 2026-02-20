'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import {
  getUserOrganization,
  createDefaultOrganization,
} from '@/lib/actions/organization';
import type { Organization, OrgMembership } from '@/lib/actions/organization';

export type { Organization, OrgMembership };

interface UseOrganizationReturn {
  organization: Organization | null;
  role: OrgMembership['role'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrganization(): UseOrganizationReturn {
  const { user } = useAuthContext();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<OrgMembership['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!user) {
      setOrganization(null);
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const existing = await getUserOrganization();
    if (existing) {
      setOrganization(existing.organization);
      setRole(existing.role);
      setLoading(false);
      return;
    }

    // No org found — provision a default workspace
    const { organization: created, error: createError } =
      await createDefaultOrganization();

    if (createError || !created) {
      setError(createError ?? 'Failed to initialize workspace');
      setLoading(false);
      return;
    }

    setOrganization(created);
    setRole('owner');
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return { organization, role, loading, error, refetch: fetchOrganization };
}
