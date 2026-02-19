'use client';

import { Button } from '@/components/ui/button';
import { DateRangePreset } from '@/types';
import { useState } from 'react';

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'last7days', label: '7d' },
  { value: 'last30days', label: '30d' },
  { value: 'last90days', label: '90d' },
];

export function DashboardHeader() {
  const [dateRange, setDateRange] = useState<DateRangePreset>('last30days');

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaign Overview</h1>
        <p className="text-sm text-muted-foreground">
          All platforms · Updated just now
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border bg-background">
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={dateRange === preset.value ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none first:rounded-l-lg last:rounded-r-lg"
              onClick={() => setDateRange(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <Button>+ New Campaign</Button>
      </div>
    </div>
  );
}
