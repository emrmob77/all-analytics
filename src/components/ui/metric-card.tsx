'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// AnimNum — animated number counter (ease-out cubic)
// ---------------------------------------------------------------------------

interface AnimNumProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

function AnimNum({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1000,
}: AnimNumProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(+(eased * value).toFixed(decimals));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
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
// MetricCard
// ---------------------------------------------------------------------------

export interface MetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Change percentage string, e.g. "12.4%" */
  change?: string;
  /** true = green (up), false = red (down) */
  positive?: boolean;
  /** Sub-label shown after the change, e.g. "vs last period" */
  sub?: string;
  /** Show skeleton loading state */
  loading?: boolean;
  /** Staggered entry delay in ms */
  delay?: number;
  className?: string;
}

export function MetricCard({
  label,
  value,
  prefix,
  suffix,
  decimals,
  change,
  positive,
  sub,
  loading = false,
  delay = 0,
  className,
}: MetricCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (loading) {
    return (
      <div
        className={cn(
          'flex-1 rounded-[10px] border border-[#E3E8EF] bg-white px-[18px] py-4',
          className,
        )}
        style={{ minWidth: 150 }}
      >
        <div className="mb-2 h-3 w-20 animate-pulse rounded bg-gray-100" />
        <div className="mb-2 h-7 w-28 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex-1 rounded-[10px] border border-[#E3E8EF] bg-white px-[18px] py-4 transition-all duration-[450ms]',
        className,
      )}
      style={{
        minWidth: 150,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(7px)',
      }}
    >
      <div className="mb-2 text-[11.5px] font-medium text-[#5F6368]">{label}</div>
      <div className="mb-2 text-[26px] font-bold leading-tight tracking-[-0.5px] text-[#202124]">
        <AnimNum value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      {(change !== undefined || sub) && (
        <div className="flex items-center gap-1.5 text-[11.5px]">
          {change !== undefined && (
            <span className={`font-semibold ${positive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
              {positive ? '↑' : '↓'} {change}
            </span>
          )}
          {sub && <span className="text-[#9AA0A6]">{sub}</span>}
        </div>
      )}
    </div>
  );
}
