"use client";

import type { ReactNode } from "react";

import { useAuthSession } from "@/contexts/AuthSessionContext";
import { canAccessRole } from "@/lib/auth/rbac";
import type { AppRole } from "@/lib/auth/mockAuthStore";

interface RoleGateProps {
  minimumRole: AppRole;
  fallback?: ReactNode;
  children: ReactNode;
}

function RoleGate({ minimumRole, fallback, children }: RoleGateProps) {
  const { session } = useAuthSession();

  if (!session) {
    return <>{fallback ?? null}</>;
  }

  const allowed = canAccessRole(minimumRole, session.user.role);

  if (!allowed) {
    return (
      <>
        {fallback ?? (
          <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            You do not have sufficient permissions to view this section.
          </section>
        )}
      </>
    );
  }

  return <>{children}</>;
}

export default RoleGate;
