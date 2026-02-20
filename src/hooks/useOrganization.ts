'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  // Prevent concurrent executions (React Strict Mode double-invoke, fast remounts)
  const runningRef = useRef(false);

  const fetchOrganization = useCallback(async () => {
    if (!user) {
      setOrganization(null);
      setRole(null);
      setLoading(false);
      return;
    }

    if (runningRef.current) return;
    runningRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const existing = await getUserOrganization();
      if (existing) {
        setOrganization(existing.organization);
        setRole(existing.role);
        return;
      }

      // No org found — provision a default workspace
      const { organization: created, error: createError } =
        await createDefaultOrganization();

      if (createError || !created) {
        setError(createError ?? 'Failed to initialize workspace');
        return;
      }

      setOrganization(created);
      setRole('owner');
    } catch (err) {
      // Capture thrown exceptions (network failures, serialization errors, etc.)
      // so they surface in error state instead of becoming unhandled rejections.
      setError(err instanceof Error ? err.message : 'Unexpected error initializing workspace');
    } finally {
      setLoading(false);
      runningRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return { organization, role, loading, error, refetch: fetchOrganization };
}
