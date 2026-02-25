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

  return (
    <>
      {prefix}
      {decimals > 0 ? display.toFixed(decimals) : display.toLocaleString('en-US')}
      {suffix}
    </>
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

  const positive = change === undefined ? true : change >= 0;
  const changeAbs = change !== undefined ? Math.abs(change) : undefined;

  if (loading) {
    return (
      <div className="flex-1 rounded-[10px] border border-[#E3E8EF] bg-white px-[18px] py-4" style={{ minWidth: 150 }}>
        <div className="mb-2 h-3 w-24 rounded bg-[#F1F3F4] animate-pulse" />
        <div className="mb-2 h-8 w-32 rounded bg-[#F1F3F4] animate-pulse" />
        <div className="h-3 w-20 rounded bg-[#F1F3F4] animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="metric-card-enter flex-1 rounded-[10px] border border-[#E3E8EF] bg-white px-[18px] py-4"
      style={{
        minWidth: 150,
        animationDelay: `${Math.max(0, delay)}ms`,
      }}
    >
      <div className="mb-2 text-[11.5px] font-medium text-[#5F6368]">{title}</div>
      <div className="mb-2 text-[26px] font-bold leading-tight tracking-[-0.5px] text-[#202124]">
        <AnimNum value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      {changeAbs !== undefined && (
        <div className="flex items-center gap-1.5 text-[11.5px]">
          <span className={`font-semibold ${positive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
            {positive ? '↑' : '↓'} {changeAbs.toFixed(1)}%
          </span>
          <span className="text-[#9AA0A6]">{sub}</span>
        </div>
      )}
    </div>
  );
}
