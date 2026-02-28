'use client';

import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// AnimNum — smooth animated counter
// ---------------------------------------------------------------------------

interface AnimNumProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

const NUMBER_LOCALE = 'en-US';

function formatMetricNumber(value: number, decimals: number) {
  if (decimals > 0) {
    return value.toLocaleString(NUMBER_LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return Math.round(value).toLocaleString(NUMBER_LOCALE);
}

function AnimNum({ value, prefix = '', suffix = '', decimals = 0, duration = 1000 }: AnimNumProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(+(eased * value).toFixed(decimals));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, decimals, duration]);

  const formatted = formatMetricNumber(display, decimals);

  return (
    <span className="whitespace-nowrap">
      {prefix ? <span className="mr-1">{prefix}</span> : null}
      {formatted}
      {suffix ? <span className="ml-0.5">{suffix}</span> : null}
    </span>
  );
}

// ---------------------------------------------------------------------------
// MetricCard — reusable metric display card
// ---------------------------------------------------------------------------

export interface MetricCardProps {
  title: string;
  value: number;
  change?: number; // percentage change, positive = up, negative = down
  format?: 'currency' | 'number' | 'percentage';
  /** Override decimals derived from format */
  decimals?: number;
  /** Override suffix derived from format */
  suffix?: string;
  loading?: boolean;
  delay?: number;
  sub?: string;
  prefix?: string;
}

export function MetricCard({
  title,
  value,
  change,
  format = 'number',
  decimals: decimalsOverride,
  suffix: suffixOverride,
  loading = false,
  delay = 0,
  sub = 'vs last period',
  prefix: prefixOverride,
}: MetricCardProps) {
  const prefix = prefixOverride !== undefined ? prefixOverride : format === 'currency' ? '$' : '';
  const suffix = suffixOverride !== undefined ? suffixOverride : format === 'percentage' ? '%' : '';
  const decimals = decimalsOverride !== undefined ? decimalsOverride : format === 'percentage' ? 2 : 0;
  const previewText = `${prefix ? `${prefix} ` : ''}${formatMetricNumber(value, decimals)}${suffix ?? ''}`;
  const valueSizeClass =
    previewText.length >= 16
      ? 'text-[1.3rem]'
      : previewText.length >= 13
        ? 'text-[1.5rem]'
        : 'text-[1.7rem]';

  const positive = change === undefined ? true : change >= 0;
  const changeAbs = change !== undefined ? Math.abs(change) : undefined;

  if (loading) {
    return (
      <div className="min-w-0 rounded-[10px] border border-[#E3E8EF] bg-white px-[18px] py-4">
        <div className="mb-2 h-3 w-24 rounded bg-[#F1F3F4] animate-pulse" />
        <div className="mb-2 h-8 w-32 rounded bg-[#F1F3F4] animate-pulse" />
        <div className="h-3 w-20 rounded bg-[#F1F3F4] animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="metric-card-enter min-w-0 rounded-[10px] border border-[#E3E8EF] bg-white px-[18px] py-4"
      style={{ animationDelay: `${Math.max(0, delay)}ms` }}
    >
      <div className="mb-2 text-[11.5px] font-medium text-[#5F6368]">{title}</div>
      <div
        className={`mb-2 whitespace-nowrap font-bold leading-[1.12] tracking-[-0.015em] text-[#202124] tabular-nums ${valueSizeClass}`}
        title={previewText}
      >
        <AnimNum value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      {changeAbs !== undefined && (
        <div className="flex min-w-0 items-center gap-1.5 text-[11.5px]">
          <span className={`font-semibold ${positive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
            {positive ? '↑' : '↓'} {changeAbs.toFixed(1)}%
          </span>
          <span className="truncate text-[#9AA0A6]">{sub}</span>
        </div>
      )}
    </div>
  );
}
