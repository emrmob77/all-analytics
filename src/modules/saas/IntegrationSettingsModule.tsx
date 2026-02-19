"use client";

import { useEffect, useState } from "react";

import RoleGate from "@/components/auth/RoleGate";
import Badge from "@/components/ui/Badge";
import { requestApi } from "@/modules/saas/shared";
import { toast } from "@/lib/toast";

interface IntegrationRecord {
  id: string;
  providerName: string;
  providerKey: string;
  authMode: "oauth2" | "api_key" | "service_account";
  lifecycleState: "connected" | "syncing" | "paused" | "failed";
  syncFrequency: "hourly" | "daily";
  lastSyncAt: string | null;
  scopes: string[];
}

function IntegrationSettingsModule() {
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadIntegrations() {
    setIsLoading(true);

    try {
      const data = await requestApi<{ integrations: IntegrationRecord[] }>("/api/v1/settings/integrations");
      setIntegrations(data.integrations);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load integrations.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadIntegrations();
  }, []);

  async function updateIntegration(
    integrationId: string,
    payload: {
      lifecycleState?: string;
      syncFrequency?: string;
    }
  ) {
    try {
      const data = await requestApi<{ integration: IntegrationRecord; testConnection: { status: string } }>(
        "/api/v1/settings/integrations",
        {
          method: "PUT",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            integrationId,
            ...payload
          })
        }
      );

      setIntegrations((current) =>
        current.map((integration) => (integration.id === integrationId ? data.integration : integration))
      );

      if (data.testConnection.status === "ok") {
        toast.success("Integration updated and connection test passed.");
      } else {
        toast.info("Integration updated but connection test reported issues.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update integration.");
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading integration settings...</p>
      </section>
    );
  }

  return (
    <RoleGate minimumRole="member">
      <div className="space-y-4">
        {integrations.map((integration) => (
          <section
            className="rounded-xl border border-border-light bg-surface-light p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark"
            key={integration.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-text-main-light dark:text-text-main-dark">{integration.providerName}</h2>
                <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">
                  Auth mode: {integration.authMode} · Last sync: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : "Not synced yet"}
                </p>
                <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">Scopes: {integration.scopes.join(", ")}</p>
              </div>

              <Badge
                connectionState={integration.lifecycleState === "connected" || integration.lifecycleState === "syncing" ? "connected" : "inactive"}
                showDot
                variant="connection"
              >
                {integration.lifecycleState}
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select
                className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark"
                defaultValue={integration.lifecycleState}
                onChange={(event) =>
                  void updateIntegration(integration.id, {
                    lifecycleState: event.target.value
                  })
                }
              >
                <option value="connected">Connected</option>
                <option value="syncing">Syncing</option>
                <option value="paused">Paused</option>
                <option value="failed">Failed</option>
              </select>

              <select
                className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark"
                defaultValue={integration.syncFrequency}
                onChange={(event) =>
                  void updateIntegration(integration.id, {
                    syncFrequency: event.target.value
                  })
                }
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
              </select>

              <button
                className="rounded-md border border-border-light px-3 py-2 text-sm font-medium text-text-main-light hover:bg-gray-50 dark:border-border-dark dark:text-text-main-dark dark:hover:bg-gray-800"
                onClick={() =>
                  void updateIntegration(integration.id, {
                    lifecycleState: "connected"
                  })
                }
                type="button"
              >
                Reconnect
              </button>

              <button
                className="rounded-md border border-border-light px-3 py-2 text-sm font-medium text-text-main-light hover:bg-gray-50 dark:border-border-dark dark:text-text-main-dark dark:hover:bg-gray-800"
                onClick={() =>
                  void updateIntegration(integration.id, {
                    lifecycleState: "paused"
                  })
                }
                type="button"
              >
                Disconnect
              </button>

              <button
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white"
                onClick={() =>
                  void updateIntegration(integration.id, {
                    lifecycleState: "syncing"
                  })
                }
                type="button"
              >
                Test Connection
              </button>
            </div>
          </section>
        ))}
      </div>
    </RoleGate>
  );
}

export default IntegrationSettingsModule;
