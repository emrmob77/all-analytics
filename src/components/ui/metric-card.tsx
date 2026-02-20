'use client';

import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// AnimNum — smooth count-up animation using requestAnimationFrame
// ---------------------------------------------------------------------------

interface AnimNumProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

function AnimNum({ value, prefix = '', suffix = '', decimals = 0, duration = 900 }: AnimNumProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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
// MetricCard
// ---------------------------------------------------------------------------

export interface MetricCardProps {
  label: string;
  value: number;
  /** Currency symbol or other prefix displayed before the value (e.g. "$") */
  prefix?: string;
  /** Unit displayed after the value (e.g. "%" or "x") */
  suffix?: string;
  /** Decimal places for the animated number */
  decimals?: number;
  /** Percentage change vs. the comparison period (positive = good) */
  change?: number;
  /** Whether the change direction is positive when the number goes up */
  positiveIsUp?: boolean;
  /** Label shown next to the change (e.g. "vs last period") */
  comparePeriod?: string;
  /** Shows a skeleton placeholder instead of real data */
  loading?: boolean;
  /** Staggered entrance delay in ms */
  delay?: number;
}

export function MetricCard({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  change,
  positiveIsUp = true,
  comparePeriod = 'vs last period',
  loading = false,
  delay = 0,
}: MetricCardProps) {
  // Skeletons appear immediately; stagger delay only applies to real data.
  const [visible, setVisible] = useState(loading);

  useEffect(() => {
    if (loading) { setVisible(true); return; }
    setVisible(false);
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay, loading]);

  const isPositive = change !== undefined ? (positiveIsUp ? change >= 0 : change <= 0) : true;
  const changeAbs = change !== undefined ? Math.abs(change).toFixed(1) : null;

  return (
    <div
      className="flex-1 min-w-[150px] rounded-[10px] border border-[#E3E8EF] bg-white px-[18px] py-4 transition-all duration-[450ms]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(7px)',
      }}
    >
      {/* Label */}
      <div className="mb-2 text-[11.5px] font-medium text-[#5F6368]">{label}</div>

      {/* Value */}
      <div className="mb-2 text-[26px] font-bold leading-tight tracking-[-0.5px] text-[#202124]">
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-[#F1F3F4]" />
        ) : (
          <AnimNum value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        )}
      </div>

      {/* Change indicator */}
      <div className="flex items-center gap-1.5 text-[11.5px]">
        {loading ? (
          <div className="h-3.5 w-20 animate-pulse rounded bg-[#F1F3F4]" />
        ) : changeAbs !== null ? (
          <>
            <span className={`font-semibold ${isPositive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
              {change !== undefined && change >= 0 ? '↑' : '↓'} {changeAbs}%
            </span>
            <span className="text-[#9AA0A6]">{comparePeriod}</span>
          </>
        ) : (
          <span className="text-[#9AA0A6]">{comparePeriod}</span>
        )}
      </div>
    </div>
  );
}
