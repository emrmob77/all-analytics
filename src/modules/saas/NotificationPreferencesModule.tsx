"use client";

import { FormEvent, useEffect, useState } from "react";

import { requestApi } from "@/modules/saas/shared";
import { toast } from "@/lib/toast";

interface NotificationPreferences {
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

interface DeliveryLog {
  id: string;
  eventType: string;
  channel: string;
  templateKey: string;
  message: string;
  deliveredAt: string;
}

function NotificationPreferencesModule() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);

    try {
      const [preferencesData, logData] = await Promise.all([
        requestApi<{ preferences: NotificationPreferences }>("/api/v1/notifications/preferences"),
        requestApi<{ logs: DeliveryLog[] }>("/api/v1/notifications/delivery-logs")
      ]);

      setPreferences(preferencesData.preferences);
      setLogs(logData.logs);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load notification data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function updatePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      const data = await requestApi<{ preferences: NotificationPreferences }>("/api/v1/notifications/preferences", {
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
      toast.success("Notification preferences saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save preferences.");
    }
  }

  async function simulateNotificationEvent(eventType: string) {
    try {
      await requestApi<{ deliveryLogs: DeliveryLog[] }>("/api/v1/notifications/events", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          eventType,
          payload: {
            platform: "Google Ads",
            changePercent: 28,
            currentRoas: 2.7,
            provider: "GA4",
            code: "SYNC_TIMEOUT",
            reportName: "Weekly Performance"
          }
        })
      });

      const data = await requestApi<{ logs: DeliveryLog[] }>("/api/v1/notifications/delivery-logs");
      setLogs(data.logs);
      toast.success("Event processed and notifications delivered.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not trigger event.");
    }
  }

  if (isLoading || !preferences) {
    return (
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading notification preferences...</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Notification Preferences</h2>
        <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
          Configure per-user channels, quiet hours, timezone and threshold alerts.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={updatePreferences}>
          <label className="flex items-center gap-2 text-sm text-text-main-light dark:text-text-main-dark">
            <input defaultChecked={preferences.channels.inApp} name="inApp" type="checkbox" /> In-app
          </label>
          <label className="flex items-center gap-2 text-sm text-text-main-light dark:text-text-main-dark">
            <input defaultChecked={preferences.channels.email} name="email" type="checkbox" /> Email
          </label>

          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={String(preferences.thresholds.spendSpikePercent)} min={1} name="spendSpikePercent" type="number" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={String(preferences.thresholds.roasDropPercent)} min={1} name="roasDropPercent" type="number" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={String(preferences.thresholds.syncFailureCount)} min={1} name="syncFailureCount" type="number" />

          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={preferences.quietHours.start} name="quietHoursStart" type="time" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue={preferences.quietHours.end} name="quietHoursEnd" type="time" />
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark md:col-span-2" defaultValue={preferences.timezone} name="timezone" />

          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white md:col-span-2" type="submit">
            Save Preferences
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Delivery Pipeline</h2>
        <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
          Trigger event-to-notification mapping and inspect delivery logs.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark" onClick={() => void simulateNotificationEvent("budget_spike")} type="button">
            Trigger Budget Spike
          </button>
          <button className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark" onClick={() => void simulateNotificationEvent("roas_drop")} type="button">
            Trigger ROAS Drop
          </button>
          <button className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark" onClick={() => void simulateNotificationEvent("integration_failed")} type="button">
            Trigger Sync Failure
          </button>
          <button className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark" onClick={() => void simulateNotificationEvent("report_ready")} type="button">
            Trigger Report Ready
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {logs.slice(0, 8).map((log) => (
            <article className="rounded-lg border border-border-light p-3 text-sm dark:border-border-dark" key={log.id}>
              <p className="font-medium text-text-main-light dark:text-text-main-dark">
                {log.eventType} · {log.channel}
              </p>
              <p className="mt-1 text-text-muted-light dark:text-text-muted-dark">{log.message}</p>
              <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">Template: {log.templateKey}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default NotificationPreferencesModule;
