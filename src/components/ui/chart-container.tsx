'use client';

import { useId } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartData {
  [key: string]: string | number;
}

export interface ChartContainerProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartData[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  loading?: boolean;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

// ---------------------------------------------------------------------------
// Default palette
// ---------------------------------------------------------------------------

const DEFAULT_COLORS = ['#1A73E8', '#0866FF', '#161823', '#E60023', '#34A853', '#F9AB00'];

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full rounded-lg bg-[#F1F3F4] animate-pulse"
      style={{ height }}
    />
  );
}

// ---------------------------------------------------------------------------
// ChartContainer
// ---------------------------------------------------------------------------

export function ChartContainer({
  type,
  data,
  xKey,
  yKeys,
  colors = DEFAULT_COLORS,
  loading = false,
  height = 215,
  showLegend = false,
  showGrid = true,
}: ChartContainerProps) {
  const instanceId = useId();

  if (loading) return <ChartSkeleton height={height} />;

  const commonAxis = {
    axisLine: false as const,
    tickLine: false as const,
    tick: { fontSize: 10, fill: '#9AA0A6' },
  };

  const commonTooltip = {
    contentStyle: {
      borderRadius: 8,
      border: '1px solid #E3E8EF',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      fontSize: 11.5,
    },
  };

  const renderChart = () => {
    if (type === 'pie') {
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={yKeys[0]}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            animationDuration={700}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip {...commonTooltip} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        </PieChart>
      );
    }

    if (type === 'bar') {
      return (
        <BarChart data={data} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />}
          <XAxis dataKey={xKey} {...commonAxis} />
          <YAxis {...commonAxis} />
          <Tooltip {...commonTooltip} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {yKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[i % colors.length]}
              radius={[3, 3, 0, 0]}
              animationDuration={700}
            />
          ))}
        </BarChart>
      );
    }

    if (type === 'line') {
      return (
        <LineChart data={data} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />}
          <XAxis dataKey={xKey} {...commonAxis} />
          <YAxis {...commonAxis} />
          <Tooltip {...commonTooltip} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {yKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={false}
              animationDuration={700}
            />
          ))}
        </LineChart>
      );
    }

    // area (default)
    return (
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
        <defs>
          {yKeys.map((key, i) => (
            <linearGradient key={key} id={`grad-${instanceId}-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.18} />
              <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" vertical={false} />}
        <XAxis dataKey={xKey} {...commonAxis} />
        <YAxis {...commonAxis} />
        <Tooltip {...commonTooltip} />
        {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {yKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            fill={`url(#grad-${instanceId}-${key})`}
            dot={false}
            animationDuration={700}
          />
        ))}
      </AreaChart>
    );
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
