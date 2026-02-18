"use client";

import { useMemo, useState } from "react";

import { useAppStore } from "@/store/appStore";

interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  source: string;
}

const metricCatalog: MetricDefinition[] = [
  {
    id: "revenue",
    name: "Revenue",
    description: "Total attributed revenue across active channels.",
    category: "Financial",
    source: "Data Warehouse"
  },
  {
    id: "roas",
    name: "ROAS",
    description: "Return on ad spend per campaign.",
    category: "Financial",
    source: "Ads Platforms"
  },
  {
    id: "cpa",
    name: "CPA",
    description: "Average cost per acquisition.",
    category: "Efficiency",
    source: "Ads Platforms"
  },
  {
    id: "ctr",
    name: "CTR",
    description: "Click-through rate across ad groups.",
    category: "Engagement",
    source: "Ads Platforms"
  },
  {
    id: "sessions",
    name: "Sessions",
    description: "Website session count.",
    category: "Traffic",
    source: "GA4"
  },
  {
    id: "new_users",
    name: "New Users",
    description: "First-time visitors on selected period.",
    category: "Traffic",
    source: "GA4"
  }
];

function MetricSelector() {
  const [open, setOpen] = useState(false);
  const selectedMetrics = useAppStore((state) => state.selectedMetrics);
  const addMetric = useAppStore((state) => state.addMetric);
  const removeMetric = useAppStore((state) => state.removeMetric);

  const groupedMetrics = useMemo(() => {
    return metricCatalog.reduce<Record<string, MetricDefinition[]>>((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric);
      return acc;
    }, {});
  }, []);

  function toggleMetric(metricId: string) {
    if (selectedMetrics.includes(metricId)) {
      removeMetric(metricId);
      return;
    }
    addMetric(metricId);
  }

  return (
    <>
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-light px-3 py-2 text-sm font-medium text-text-main-light transition-colors hover:bg-gray-50 dark:border-border-dark dark:text-text-main-dark dark:hover:bg-gray-800"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="material-icons-round text-lg">tune</span>
        Select Metrics
      </button>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div
            className="mx-auto mt-10 w-full max-w-3xl rounded-xl border border-border-light bg-surface-light shadow-lg dark:border-border-dark dark:bg-surface-dark"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-light p-4 dark:border-border-dark">
              <div>
                <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Metric Selector</h2>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                  Choose which metrics should appear on your dashboard cards.
                </p>
              </div>
              <button
                aria-label="Close metric selector"
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-text-muted-light transition-colors hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
                onClick={() => setOpen(false)}
                type="button"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="max-h-[65vh] space-y-5 overflow-y-auto p-4">
              {Object.entries(groupedMetrics).map(([category, metrics]) => (
                <section key={category}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
                    {category}
                  </h3>

                  <div className="space-y-2">
                    {metrics.map((metric) => {
                      const isSelected = selectedMetrics.includes(metric.id);

                      return (
                        <div
                          className="flex items-start gap-3 rounded-lg border border-border-light p-3 dark:border-border-dark"
                          key={metric.id}
                        >
                          <input
                            aria-label={`Toggle ${metric.name}`}
                            checked={isSelected}
                            className="mt-1 h-4 w-4 rounded border-border-light text-primary focus:ring-primary dark:border-border-dark"
                            onChange={() => toggleMetric(metric.id)}
                            type="checkbox"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                                {metric.name}
                              </p>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                {metric.source}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">
                              {metric.description}
                            </p>
                          </div>

                          <button
                            className={[
                              "inline-flex min-h-9 items-center rounded-md px-2 text-xs font-medium transition-colors",
                              isSelected
                                ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
                                : "bg-primary/10 text-primary hover:bg-primary/20"
                            ].join(" ")}
                            onClick={() => toggleMetric(metric.id)}
                            type="button"
                          >
                            {isSelected ? "Remove" : "Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default MetricSelector;
