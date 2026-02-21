'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrganization } from '@/hooks/useOrganization';
import { updateOrganizationName } from '@/lib/actions/profile';

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
// OrgTab
// ---------------------------------------------------------------------------

export function OrgTab() {
  const { organization, role, loading, refetch } = useOrganization();

  const [nameValue, setNameValue] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Populate input once org loads (only on first load)
  const [initialised, setInitialised] = useState(false);
  if (organization && !initialised) {
    setNameValue(organization.name);
    setInitialised(true);
  }

  const canEdit = role === 'owner' || role === 'admin';

  function handleSave() {
    setNameError(null);
    setNameSaved(false);
    startTransition(async () => {
      const { error } = await updateOrganizationName(nameValue);
      if (error) { setNameError(error); return; }
      await refetch();
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    });
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
    );
  }

  if (!organization) {
    return (
      <p className="text-sm text-red-600 py-4">No organization found.</p>
    );
  }

  return (
    <div className="space-y-4">

      {/* Organization name */}
      <Section
        title="Organization name"
        description={canEdit ? undefined : 'Only owners and admins can rename the organization.'}
      >
        <div className="flex gap-2 max-w-sm">
          <Input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder="Organization name"
            maxLength={100}
            disabled={!canEdit}
          />
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={isPending || nameValue.trim() === organization.name}
              size="sm"
              className="shrink-0"
            >
              {isPending ? 'Saving…' : nameSaved ? 'Saved ✓' : 'Save'}
            </Button>
          )}
        </div>
        {nameError && <p className="mt-1.5 text-xs text-red-600">{nameError}</p>}
      </Section>

      {/* Organization details */}
      <Section title="Details">
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-gray-500">Slug</dt>
            <dd className="font-mono text-xs text-gray-700">{organization.slug}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-gray-500">Plan</dt>
            <dd>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                Free
              </span>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-gray-500">Your role</dt>
            <dd className="capitalize text-gray-700">{role ?? '—'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-gray-500">Created</dt>
            <dd className="text-gray-700">
              {new Date(organization.created_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </Section>

    </div>
  );
}
