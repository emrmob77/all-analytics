"use client";

import { useEffect, useMemo, useState } from "react";

import { requestApi } from "@/modules/saas/shared";
import { toast } from "@/lib/toast";

interface OnboardingRecord {
  tenantId: string;
  completed: boolean;
  currentStep: "workspace" | "integration" | "kpi" | "done";
  connectedPlatforms: string[];
  selectedKpis: string[];
}

const steps: Array<OnboardingRecord["currentStep"]> = ["workspace", "integration", "kpi", "done"];
const platformOptions = ["google-ads", "meta-ads", "tiktok-ads", "linkedin-ads", "shopify", "ga4"];
const kpiOptions = ["Revenue", "ROAS", "CPA", "Conversion Rate", "Retention"];

function OnboardingModule() {
  const [onboarding, setOnboarding] = useState<OnboardingRecord | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Allanalytics Workspace");
  const [isLoading, setIsLoading] = useState(true);

  const activeStepIndex = useMemo(() => (onboarding ? steps.indexOf(onboarding.currentStep) : 0), [onboarding]);

  async function loadOnboarding() {
    setIsLoading(true);

    try {
      const data = await requestApi<{ onboarding: OnboardingRecord }>("/api/v1/onboarding/status");
      setOnboarding(data.onboarding);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load onboarding state.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOnboarding();
  }, []);

  async function persistState(next: Partial<OnboardingRecord>) {
    try {
      const data = await requestApi<{ onboarding: OnboardingRecord }>("/api/v1/onboarding/complete", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(next)
      });

      setOnboarding(data.onboarding);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Onboarding update failed.");
    }
  }

  function moveToStep(step: OnboardingRecord["currentStep"]) {
    void persistState({ currentStep: step });
  }

  function togglePlatform(platform: string) {
    if (!onboarding) return;

    const nextPlatforms = onboarding.connectedPlatforms.includes(platform)
      ? onboarding.connectedPlatforms.filter((item) => item !== platform)
      : [...onboarding.connectedPlatforms, platform];

    void persistState({
      currentStep: "integration",
      connectedPlatforms: nextPlatforms
    });
  }

  function toggleKpi(kpi: string) {
    if (!onboarding) return;

    const nextKpis = onboarding.selectedKpis.includes(kpi)
      ? onboarding.selectedKpis.filter((item) => item !== kpi)
      : [...onboarding.selectedKpis, kpi];

    void persistState({
      currentStep: "kpi",
      selectedKpis: nextKpis
    });
  }

  if (isLoading || !onboarding) {
    return (
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading onboarding...</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">First-Login Onboarding Wizard</h2>
        <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
          Create workspace, connect first channels, and configure default KPI set.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <button
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold uppercase",
                onboarding.currentStep === step
                  ? "border-primary bg-secondary text-text-main-light"
                  : "border-border-light text-text-muted-light dark:border-border-dark dark:text-text-muted-dark"
              ].join(" ")}
              key={step}
              onClick={() => moveToStep(step)}
              type="button"
            >
              {index + 1}. {step}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h3 className="text-base font-semibold text-text-main-light dark:text-text-main-dark">Step 1: Workspace Setup</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-72 flex-1 rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark"
            onChange={(event) => setWorkspaceName(event.target.value)}
            value={workspaceName}
          />
          <button
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white"
            onClick={() => {
              toast.success(`Workspace '${workspaceName}' saved.`);
              moveToStep("integration");
            }}
            type="button"
          >
            Save Workspace
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h3 className="text-base font-semibold text-text-main-light dark:text-text-main-dark">Step 2: Connect First Platforms</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {platformOptions.map((platform) => (
            <button
              className={[
                "rounded-md border px-3 py-2 text-sm",
                onboarding.connectedPlatforms.includes(platform)
                  ? "border-primary bg-secondary text-text-main-light"
                  : "border-border-light text-text-muted-light dark:border-border-dark dark:text-text-muted-dark"
              ].join(" ")}
              key={platform}
              onClick={() => togglePlatform(platform)}
              type="button"
            >
              {platform}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h3 className="text-base font-semibold text-text-main-light dark:text-text-main-dark">Step 3: Select Default KPIs</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {kpiOptions.map((kpi) => (
            <button
              className={[
                "rounded-md border px-3 py-2 text-sm",
                onboarding.selectedKpis.includes(kpi)
                  ? "border-primary bg-secondary text-text-main-light"
                  : "border-border-light text-text-muted-light dark:border-border-dark dark:text-text-muted-dark"
              ].join(" ")}
              key={kpi}
              onClick={() => toggleKpi(kpi)}
              type="button"
            >
              {kpi}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              void persistState({
                currentStep: "done",
                completed: true
              });
              toast.success("Onboarding completed.");
            }}
            type="button"
          >
            Complete Onboarding
          </button>

          <button className="rounded-md border border-border-light px-4 py-2 text-sm dark:border-border-dark" onClick={() => void loadOnboarding()} type="button">
            Refresh State
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
        <h3 className="text-base font-semibold text-text-main-light dark:text-text-main-dark">Demo Data & Empty States</h3>
        <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">
          {onboarding.connectedPlatforms.length === 0
            ? "No platform connected yet. Use 'Connect First Platforms' to populate dashboard demo data."
            : `Connected platforms: ${onboarding.connectedPlatforms.join(", ")}.`}
        </p>
        <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
          {onboarding.selectedKpis.length === 0
            ? "No KPI selected. Choose default KPIs to personalize overview cards."
            : `Selected KPIs: ${onboarding.selectedKpis.join(", ")}.`}
        </p>
        <p className="mt-2 text-xs text-text-muted-light dark:text-text-muted-dark">Current step index: {activeStepIndex + 1}</p>
      </section>
    </div>
  );
}

export default OnboardingModule;
