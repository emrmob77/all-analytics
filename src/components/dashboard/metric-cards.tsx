'use client';

import { useState, useEffect, useRef } from 'react';

interface AnimNumProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

function AnimNum({ value, prefix = '', suffix = '', decimals = 0, duration = 1000 }: AnimNumProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(+(eased * value).toFixed(decimals));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, decimals, duration]);

  return (
    <>
      {prefix}
      {decimals > 0 ? displayValue.toFixed(decimals) : displayValue.toLocaleString('en-US')}
      {suffix}
    </>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change: string;
  positive: boolean;
  sub: string;
  delay: number;
}

function StatCard({ label, value, prefix, suffix, decimals, change, positive, sub, delay }: StatCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className="flex-1 rounded-[10px] border border-[#E3E8EF] bg-white px-[18px] py-4 transition-all duration-[450ms]"
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
      <div className="flex items-center gap-1.5 text-[11.5px]">
        <span className={`font-semibold ${positive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
          {positive ? '↑' : '↓'} {change}
        </span>
        <span className="text-[#9AA0A6]">{sub}</span>
      </div>
    </div>
  );
}

const STATS = [
  { label: 'Total Impressions', value: 5962000, change: '12.4%', positive: true, sub: 'vs last period', delay: 0 },
  { label: 'Total Clicks', value: 105300, change: '8.7%', positive: true, sub: 'vs last period', delay: 70 },
  { label: 'Total Spend', value: 10471, prefix: '$', change: '5.2%', positive: true, sub: 'vs last period', delay: 140 },
  { label: 'Avg. CTR', value: 1.77, suffix: '%', decimals: 2, change: '0.3%', positive: true, sub: 'vs last period', delay: 210 },
  { label: 'Conversions', value: 1722, change: '18.1%', positive: true, sub: 'vs last period', delay: 280 },
  { label: 'Avg. ROAS', value: 4.58, suffix: 'x', decimals: 2, change: '2.1%', positive: true, sub: 'vs last period', delay: 350 },
];

export function MetricCards() {
  return (
    <div className="flex flex-wrap gap-3">
      {STATS.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
