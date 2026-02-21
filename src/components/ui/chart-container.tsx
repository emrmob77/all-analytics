'use client';

import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export interface ChartContainerProps {
  /** Chart section title */
  title?: string;
  /** Chart area height in px. Default 220. */
  height?: number;
  /** Show skeleton loading state */
  loading?: boolean;
  /** Recharts chart element (must accept width/height from ResponsiveContainer) */
  children: React.ReactNode;
  className?: string;
  /** Optional action/button rendered top-right */
  action?: React.ReactNode;
}

export function ChartContainer({
  title,
  height = 220,
  loading = false,
  children,
  className,
  action,
}: ChartContainerProps) {
  if (loading) {
    return (
      <div className={cn('rounded-[12px] border border-[#E3E8EF] bg-white p-5', className)}>
        {title && <div className="mb-4 h-4 w-32 animate-pulse rounded bg-gray-100" />}
        <div className="animate-pulse rounded bg-gray-100" style={{ height }} />
      </div>
    );
  }

  return (
    <div className={cn('rounded-[12px] border border-[#E3E8EF] bg-white p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h3 className="text-[13px] font-semibold text-[#202124]">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
