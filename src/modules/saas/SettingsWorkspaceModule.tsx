"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import RoleGate from "@/components/auth/RoleGate";
import { requestApi } from "@/modules/saas/shared";
import { toast } from "@/lib/toast";

interface ProfileRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  language: string;
  timezone: string;
  locale: string;
  role: "owner" | "admin" | "member" | "viewer";
}

interface WorkspaceRecord {
  tenantId: string;
  name: string;
  logoUrl: string;
  defaultCurrency: string;
  dataRetentionDays: number;
  exportFormat: "csv" | "xlsx" | "json";
  permissionDefaults: "owner" | "admin" | "member" | "viewer";
}

interface NotificationPreferencesRecord {
  tenantId: string;
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
  };
  thresholds: {
    spendSpikePercent: number;
    roasDropPercent: number;
    syncFailureCount: number;
  };
  quietHours: {
    start: string;
    end: string;
  };
  timezone: string;
}

interface IntegrationSettingRecord {
  id: string;
  providerName: string;
  lifecycleState: "connected" | "syncing" | "paused" | "failed";
  syncFrequency: "hourly" | "daily";
  lastSyncAt: string | null;
  scopes: string[];
}

function SettingsWorkspaceModule() {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceRecord | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferencesRecord | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationSettingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const integrationCount = useMemo(() => integrations.length, [integrations]);

  async function loadData() {
    setIsLoading(true);

    try {
      const [profileData, workspaceData, preferenceData, integrationData] = await Promise.all([
        requestApi<{ profile: ProfileRecord }>("/api/v1/settings/profile"),
        requestApi<{ workspace: WorkspaceRecord }>("/api/v1/settings/workspace"),
        requestApi<{ preferences: NotificationPreferencesRecord }>("/api/v1/notifications/preferences"),
        requestApi<{ integrations: IntegrationSettingRecord[] }>("/api/v1/settings/integrations")
      ]);

      setProfile(profileData.profile);
      setWorkspace(workspaceData.workspace);
      setPreferences(preferenceData.preferences);
      setIntegrations(integrationData.integrations);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      const data = await requestApi<{ profile: ProfileRecord }>("/api/v1/settings/profile", {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          language: formData.get("language"),
          timezone: formData.get("timezone"),
          locale: formData.get("locale")
        })
      });

      setProfile(data.profile);
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile update failed.");
    }
  }

  async function saveWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      const data = await requestApi<{ workspace: WorkspaceRecord }>("/api/v1/settings/workspace", {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name: formData.get("name"),
          logoUrl: formData.get("logoUrl"),
          defaultCurrency: formData.get("defaultCurrency"),
          dataRetentionDays: Number(formData.get("dataRetentionDays")),
          exportFormat: formData.get("exportFormat"),
          permissionDefaults: formData.get("permissionDefaults")
        })
      });

      setWorkspace(data.workspace);
      toast.success("Workspace updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Workspace update failed.");
    }
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      const data = await requestApi<{ preferences: NotificationPreferencesRecord }>("/api/v1/notifications/preferences", {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          inApp: formData.get("inApp") === "on",
          email: formData.get("email") === "on",
          spendSpikePercent: Number(formData.get("spendSpikePercent")),
          roasDropPercent: Number(formData.get("roasDropPercent")),
          syncFailureCount: Number(formData.get("syncFailureCount")),
          quietHoursStart: formData.get("quietHoursStart"),
          quietHoursEnd: formData.get("quietHoursEnd"),
          timezone: formData.get("timezone")
        })
      });

      setPreferences(data.preferences);
      toast.success("Notification preferences updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notification update failed.");
    }
  }

  async function updateIntegration(id: string, payload: { lifecycleState?: string; syncFrequency?: string }) {
    try {
      const data = await requestApi<{ integration: IntegrationSettingRecord }>("/api/v1/settings/integrations", {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          integrationId: id,
          ...payload
        })
      });

      setIntegrations((current) => current.map((item) => (item.id === id ? data.integration : item)));
      toast.success("Integration settings updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Integration update failed.");
    }
  }

  if (isLoading || !profile || !workspace || !preferences) {
    return (
      <section className="rounded-xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading settings...</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">User Profile Settings</h2>
        <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">Update profile, locale, and timezone preferences.</p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={saveProfile}>
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={profile.firstName} name="firstName" required placeholder="First name" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={profile.lastName} name="lastName" required placeholder="Last name" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark md:col-span-2" defaultValue={profile.email} name="email" required placeholder="Email" type="email" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={profile.language} name="language" placeholder="Language" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={profile.locale} name="locale" placeholder="Locale" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark md:col-span-2" defaultValue={profile.timezone} name="timezone" placeholder="Timezone" />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white md:col-span-2" type="submit">
            Save Profile
          </button>
        </form>
      </section>

      <RoleGate minimumRole="admin">
        <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Workspace Settings</h2>
          <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
            Configure workspace identity, retention, export and permission defaults.
          </p>

          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={saveWorkspace}>
            <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={workspace.name} name="name" required placeholder="Workspace name" />
            <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={workspace.defaultCurrency} name="defaultCurrency" required placeholder="Currency" />
            <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark md:col-span-2" defaultValue={workspace.logoUrl} name="logoUrl" placeholder="Logo URL" />
            <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={String(workspace.dataRetentionDays)} min={7} name="dataRetentionDays" required type="number" />
            <select className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={workspace.exportFormat} name="exportFormat">
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
              <option value="json">JSON</option>
            </select>
            <select className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark md:col-span-2" defaultValue={workspace.permissionDefaults} name="permissionDefaults">
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white md:col-span-2" type="submit">
              Save Workspace
            </button>
          </form>
        </section>
      </RoleGate>

      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Notification Preferences</h2>
        <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">Control channels, thresholds, and quiet hours per user.</p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={savePreferences}>
          <label className="flex items-center gap-2 text-sm text-text-main-light dark:text-text-main-dark">
            <input defaultChecked={preferences.channels.inApp} name="inApp" type="checkbox" /> In-app alerts
          </label>
          <label className="flex items-center gap-2 text-sm text-text-main-light dark:text-text-main-dark">
            <input defaultChecked={preferences.channels.email} name="email" type="checkbox" /> Email alerts
          </label>

          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={String(preferences.thresholds.spendSpikePercent)} min={1} name="spendSpikePercent" type="number" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={String(preferences.thresholds.roasDropPercent)} min={1} name="roasDropPercent" type="number" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={String(preferences.thresholds.syncFailureCount)} min={1} name="syncFailureCount" type="number" />

          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={preferences.quietHours.start} name="quietHoursStart" type="time" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={preferences.quietHours.end} name="quietHoursEnd" type="time" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark md:col-span-2" defaultValue={preferences.timezone} name="timezone" placeholder="Timezone" />

          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white md:col-span-2" type="submit">
            Save Notification Preferences
          </button>
        </form>
      </section>

      <RoleGate minimumRole="admin">
        <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Integration Settings</h2>
          <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
            Connected accounts: {integrationCount}. Configure sync frequency and run health checks.
          </p>

          <div className="mt-4 space-y-3">
            {integrations.map((integration) => (
              <article className="rounded-lg border border-border-light p-4 dark:border-border-dark" key={integration.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">{integration.providerName}</h3>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      State: {integration.lifecycleState} · Last sync: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : "N/A"}
                    </p>
                    <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">Scopes: {integration.scopes.join(", ")}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-md border border-border-light px-2 py-1 text-xs dark:border-border-dark dark:bg-background-dark"
                      defaultValue={integration.syncFrequency}
                      onChange={(event) => void updateIntegration(integration.id, { syncFrequency: event.target.value })}
                    >
                      <option value="hourly">Hourly sync</option>
                      <option value="daily">Daily sync</option>
                    </select>

                    <select
                      className="rounded-md border border-border-light px-2 py-1 text-xs dark:border-border-dark dark:bg-background-dark"
                      defaultValue={integration.lifecycleState}
                      onChange={(event) => void updateIntegration(integration.id, { lifecycleState: event.target.value })}
                    >
                      <option value="connected">Connected</option>
                      <option value="syncing">Syncing</option>
                      <option value="paused">Paused</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </RoleGate>
    </div>
  );
}

export default SettingsWorkspaceModule;
