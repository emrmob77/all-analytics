'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  getUserOrganization,
  createDefaultOrganization,
} from '@/lib/actions/organization';
import type { Organization, OrgMembership } from '@/lib/actions/organization';

interface OrganizationContextValue {
  organization: Organization | null;
  role: OrgMembership['role'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<OrgMembership['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Prevent concurrent executions (React Strict Mode double-invoke, manual refetch race)
  const runningRef = useRef(false);

  const fetchOrganization = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    setLoading(true);
    setError(null);

    try {
      // getUserOrganization handles its own auth check on the server — no need
      // to wait for the client-side AuthProvider to resolve first.
      const existing = await getUserOrganization();
      if (existing) {
        setOrganization(existing.organization);
        setRole(existing.role);
        return;
      }

      // No org yet — provision a default workspace for new users
      const { organization: created, error: createError } = await createDefaultOrganization();
      if (createError || !created) {
        setError(createError ?? 'Failed to initialize workspace');
        return;
      }

      setOrganization(created);
      setRole('owner');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error initializing workspace');
    } finally {
      setLoading(false);
      runningRef.current = false;
    }
  }, []);

  // Fetch immediately on mount — runs in parallel with the client-side auth
  // state change (onAuthStateChange), eliminating the auth → org waterfall.
  // The middleware already guarantees this component only mounts for
  // authenticated users, so starting without waiting for user state is safe.
  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return (
    <OrganizationContext.Provider value={{ organization, role, loading, error, refetch: fetchOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganizationContext must be used within OrganizationProvider');
  return ctx;
}
