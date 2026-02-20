'use client';

import { ResponsiveContainer } from 'recharts';
import type { ReactElement } from 'react';

// ---------------------------------------------------------------------------
// ChartContainer
// ---------------------------------------------------------------------------

export interface ChartContainerProps {
  /** Card title */
  title: string;
  /** Subtitle / description shown below the title */
  subtitle?: string;
  /** Recharts chart element (AreaChart, BarChart, LineChart, PieChart, …) */
  children: ReactElement;
  /** Chart height in pixels. Default 215. */
  height?: number;
  /** Shows a skeleton placeholder while data is loading */
  loading?: boolean;
  /** Optional action button/element rendered in the top-right corner */
  action?: ReactElement;
  className?: string;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  height = 215,
  loading = false,
  action,
  className = '',
}: ChartContainerProps) {
  return (
    <div
      className={`min-w-0 rounded-[10px] border border-[#E3E8EF] bg-white px-5 py-[18px] ${className}`}
    >
      {/* Header */}
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[#202124]">{title}</div>
          {subtitle && (
            <div className="mt-0.5 text-[11.5px] text-[#9AA0A6]">{subtitle}</div>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Chart area */}
      <div style={{ height }} className="w-full">
        {loading ? (
          <div className="flex h-full w-full flex-col justify-end gap-1 pb-2">
            {/* Skeleton bars */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded bg-[#F1F3F4]"
                style={{ height: `${30 + (i % 3) * 20}%` }}
              />
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
