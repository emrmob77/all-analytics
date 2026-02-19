"use client";

import { useMemo, useState } from "react";

import { integrationCategoryLabels, integrationProviderCatalog } from "@/lib/integrations/providerCatalog";
import type { IntegrationCategory } from "@/lib/integrations/types";

interface RequestIntegrationFormState {
  providerName: string;
  requestedBy: string;
  tenantId: string;
  useCase: string;
  businessImpact: number;
  monthlySpendUsd?: number;
}

interface RequestIntegrationSuccessPayload {
  request: {
    id: string;
    providerName: string;
    priorityScore: number;
    status: string;
    createdAt: string;
  };
}

function authModeLabel(mode: string): string {
  if (mode === "oauth2") return "OAuth2";
  if (mode === "api_key") return "API Key";
  if (mode === "service_account") return "Service Account";
  return mode;
}

function IntegrationMarketplaceModule() {
  const groupedProviders = useMemo(() => {
    const grouped = new Map<IntegrationCategory, typeof integrationProviderCatalog>();

    for (const provider of integrationProviderCatalog) {
      const list = grouped.get(provider.category) ?? [];
      list.push(provider);
      grouped.set(provider.category, list);
    }

    return [...grouped.entries()].map(([category, providers]) => ({
      category,
      label: integrationCategoryLabels[category],
      providers: providers.sort((left, right) => left.name.localeCompare(right.name))
    }));
  }, []);

  const [form, setForm] = useState<RequestIntegrationFormState>({
    providerName: "",
    requestedBy: "",
    tenantId: "",
    useCase: "",
    businessImpact: 3,
    monthlySpendUsd: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPayload, setSuccessPayload] = useState<RequestIntegrationSuccessPayload | null>(null);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessPayload(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/connectors/request", {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            data: RequestIntegrationSuccessPayload;
          }
        | {
            ok: false;
            error: {
              message: string;
            };
          };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Failed to submit integration request." : payload.error.message);
      }

      setSuccessPayload(payload.data);
      setForm((current) => ({
        ...current,
        providerName: "",
        useCase: "",
        businessImpact: 3,
        monthlySpendUsd: undefined
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Integration request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h1 className="text-2xl font-semibold text-text-main-light dark:text-text-main-dark">
          Integration Marketplace
        </h1>
        <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">
          Provider-agnostic connector catalog with lifecycle states, compatibility strategy and request queue.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {groupedProviders.map((group) => (
          <article
            className="rounded-xl border border-border-light bg-surface-light p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark"
            key={group.category}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
              {group.label}
            </h2>
            <ul className="mt-4 space-y-3">
              {group.providers.map((provider) => (
                <li
                  className="rounded-lg border border-border-light p-3 dark:border-border-dark"
                  key={provider.key}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                        {provider.name}
                      </p>
                      <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">
                        Connector: <span className="font-medium">v1.0.0</span> (min compatible v1.0.0)
                      </p>
                      <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">
                        Lifecycle: <span className="font-medium">draft</span>
                      </p>
                    </div>
                    <a
                      className="text-xs font-medium text-primary hover:underline"
                      href={provider.docsUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Docs
                    </a>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.authModes.map((mode) => (
                      <span
                        className="rounded-full border border-border-light px-2 py-1 text-[11px] font-medium text-text-muted-light dark:border-border-dark dark:text-text-muted-dark"
                        key={mode}
                      >
                        {authModeLabel(mode)}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Request Integration</h2>
        <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
          Requests are prioritized by business impact, monthly spend and demand overlap.
        </p>

        <form className="mt-5 space-y-4" onSubmit={submitRequest}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-text-muted-light dark:text-text-muted-dark">
                Provider Name
              </span>
              <input
                className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-background-dark"
                onChange={(event) => setForm((current) => ({ ...current, providerName: event.target.value }))}
                required
                value={form.providerName}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-text-muted-light dark:text-text-muted-dark">Requested By</span>
              <input
                className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-background-dark"
                onChange={(event) => setForm((current) => ({ ...current, requestedBy: event.target.value }))}
                required
                value={form.requestedBy}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-text-muted-light dark:text-text-muted-dark">Tenant ID</span>
              <input
                className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-background-dark"
                onChange={(event) => setForm((current) => ({ ...current, tenantId: event.target.value }))}
                required
                value={form.tenantId}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-text-muted-light dark:text-text-muted-dark">
                Business Impact (1-5)
              </span>
              <input
                className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-background-dark"
                max={5}
                min={1}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    businessImpact: Number.parseInt(event.target.value || "1", 10)
                  }))
                }
                required
                type="number"
                value={form.businessImpact}
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs text-text-muted-light dark:text-text-muted-dark">
                Monthly Spend (USD)
              </span>
              <input
                className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-background-dark"
                min={0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    monthlySpendUsd: event.target.value ? Number.parseInt(event.target.value, 10) : undefined
                  }))
                }
                type="number"
                value={form.monthlySpendUsd ?? ""}
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs text-text-muted-light dark:text-text-muted-dark">Use Case</span>
              <textarea
                className="min-h-[90px] w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-background-dark"
                onChange={(event) => setForm((current) => ({ ...current, useCase: event.target.value }))}
                required
                value={form.useCase}
              />
            </label>
          </div>

          <button
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        {errorMessage ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        ) : null}

        {successPayload ? (
          <p className="mt-4 text-sm text-green-700 dark:text-green-400">
            Request queued with priority score {successPayload.request.priorityScore} (
            {successPayload.request.id}).
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default IntegrationMarketplaceModule;
