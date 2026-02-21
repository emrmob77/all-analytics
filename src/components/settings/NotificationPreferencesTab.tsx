'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/actions/notification-preferences';

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
// Toggle row
// ---------------------------------------------------------------------------

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A73E8]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-[#1A73E8]' : 'bg-gray-200',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotificationPreferencesTab
// ---------------------------------------------------------------------------

export function NotificationPreferencesTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    budgetAlerts: true,
    syncFailureAlerts: true,
    tokenRefreshAlerts: true,
  });
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [saved, setSaved]           = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getNotificationPreferences().then(({ data, error }) => {
      if (error) { setLoadError(error); return; }
      if (data) setPrefs(data);
    });
  }, []);

  function handleChange(key: keyof NotificationPreferences, value: boolean) {
    const previous = { ...prefs };
    const updated  = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaveError(null);
    setSaved(false);

    startTransition(async () => {
      const { error } = await updateNotificationPreferences(updated);
      if (error) {
        setPrefs(previous); // revert optimistic update on failure
        setSaveError(error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  if (loadError) {
    return <p className="text-sm text-red-600 py-4">{loadError}</p>;
  }

  return (
    <div className="space-y-4">

      <Section
        title="Email notifications"
        description="Choose which events trigger an email to admins and owners of your organization."
      >
        <div className="divide-y divide-gray-100">
          <ToggleRow
            label="Budget alerts"
            description="Notify when a campaign reaches 90% of its daily budget."
            checked={prefs.budgetAlerts}
            disabled={isPending}
            onChange={(v) => handleChange('budgetAlerts', v)}
          />
          <ToggleRow
            label="Sync failure alerts"
            description="Notify after 3 consecutive data sync failures for an ad account."
            checked={prefs.syncFailureAlerts}
            disabled={isPending}
            onChange={(v) => handleChange('syncFailureAlerts', v)}
          />
          <ToggleRow
            label="Token refresh alerts"
            description="Notify when an OAuth token expires and cannot be renewed automatically."
            checked={prefs.tokenRefreshAlerts}
            disabled={isPending}
            onChange={(v) => handleChange('tokenRefreshAlerts', v)}
          />
        </div>

        {saveError && (
          <p className="mt-3 text-xs text-red-600">{saveError}</p>
        )}
        {saved && (
          <p className="mt-3 text-xs text-green-700">Preferences saved.</p>
        )}
      </Section>

      <Section title="Delivery">
        <p className="text-sm text-gray-500">
          Notifications are sent to the email address of every <strong>owner</strong> and{' '}
          <strong>admin</strong> in the organization. Update member roles in the{' '}
          <a href="/settings?tab=members" className="text-[#1A73E8] hover:underline">
            Members
          </a>{' '}
          tab.
        </p>
      </Section>

    </div>
  );
}
