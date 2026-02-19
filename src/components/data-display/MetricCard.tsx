"use client";

import { memo } from "react";

import { formatValue } from "@/utils/formatValue";

interface MetricCardProps {
  metricName: string;
  value: number;
  valueStyle?: "number" | "currency" | "percent";
  trendDirection: "up" | "down";
  trendPercentage: number;
  onRemove?: () => void;
}

/**
 * KPI summary card with trend direction and remove action.
 */
const MetricCard = memo(function MetricCard({
  metricName,
  value,
  valueStyle = "number",
  trendDirection,
  trendPercentage,
  onRemove
}: MetricCardProps) {
  const isUp = trendDirection === "up";

  return (
    <article className="rounded-xl border border-border-light bg-surface-light p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">{metricName}</h3>
        <button
          aria-label={`Remove ${metricName}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-muted-light transition-colors hover:bg-gray-50 hover:text-primary dark:text-text-muted-dark dark:hover:bg-gray-800 md:min-h-8 md:min-w-8"
          onClick={onRemove}
          type="button"
        >
          <span className="material-icons-round text-base">close</span>
        </button>
      </div>

      <p className="mb-2 text-2xl font-semibold text-text-main-light dark:text-text-main-dark">
        {formatValue(value, { style: valueStyle })}
      </p>

      <div
        className={[
          "inline-flex items-center gap-1 text-sm font-medium",
          isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        ].join(" ")}
      >
        <span className="material-icons-round text-base">{isUp ? "trending_up" : "trending_down"}</span>
        {Math.abs(trendPercentage).toFixed(1)}%
      </div>
    </article>
  );
});

export default MetricCard;
