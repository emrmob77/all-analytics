'use client';

import { useState, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_DAYS = 365;

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'custom';

const PRESETS: { id: DateRangePreset; label: string; range: () => DateRange }[] = [
  {
    id: 'today',
    label: 'Today',
    range: () => { const d = startOfDay(new Date()); return { from: d, to: d }; },
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    range: () => { const d = startOfDay(addDays(new Date(), -1)); return { from: d, to: d }; },
  },
  {
    id: 'last7days',
    label: 'Last 7 days',
    range: () => ({ from: startOfDay(addDays(new Date(), -6)), to: startOfDay(new Date()) }),
  },
  {
    id: 'last30days',
    label: 'Last 30 days',
    range: () => ({ from: startOfDay(addDays(new Date(), -29)), to: startOfDay(new Date()) }),
  },
  {
    id: 'last90days',
    label: 'Last 90 days',
    range: () => ({ from: startOfDay(addDays(new Date(), -89)), to: startOfDay(new Date()) }),
  },
];

// ---------------------------------------------------------------------------
// DateRangePicker
// ---------------------------------------------------------------------------

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange, preset: DateRangePreset) => void;
  defaultPreset?: DateRangePreset;
  disabled?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  defaultPreset = 'last30days',
  disabled = false,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<DateRangePreset>(defaultPreset);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(value);
  const [rangeError, setRangeError] = useState<string | null>(null);

  // Keep activePreset in sync when the parent changes defaultPreset (e.g. quick-range buttons)
  useEffect(() => {
    setActivePreset(defaultPreset);
  }, [defaultPreset]);

  function handlePreset(preset: typeof PRESETS[number]) {
    const range = preset.range();
    setActivePreset(preset.id);
    setRangeError(null);
    onChange(range, preset.id);
    setOpen(false);
  }

  function handleCustomSelect(range: DateRange | undefined) {
    setCustomRange(range);
    setRangeError(null);
    // Switch to 'custom' immediately so the calendar reflects the first click
    // even before the user has picked both from and to dates.
    setActivePreset('custom');

    if (!range?.from || !range?.to) return;

    const daysDiff = Math.round(
      (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff > MAX_DAYS) {
      setRangeError(`Range cannot exceed ${MAX_DAYS} days`);
      return;
    }

    setActivePreset('custom');
    onChange(range, 'custom');
    setOpen(false);
  }

  const displayRange = activePreset !== 'custom'
    ? PRESETS.find(p => p.id === activePreset)?.range()
    : customRange ?? value;

  const triggerLabel = displayRange?.from
    ? displayRange.to && displayRange.from.toDateString() !== displayRange.to.toDateString()
      ? `${formatDate(displayRange.from)} – ${formatDate(displayRange.to)}`
      : formatDate(displayRange.from)
    : 'Select date range';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-[30px] gap-1.5 border-[#E3E8EF] bg-white px-3.5 text-xs font-medium text-[#5F6368] hover:bg-gray-50"
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="1" y="2" width="11" height="10" rx="1.5" />
            <path d="M1 5h11M4 1v2M8 1v2" />
          </svg>
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="end"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <div className="flex">
          {/* Preset list */}
          <div className="flex flex-col border-r border-[#E3E8EF] py-2">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset)}
                className={`px-4 py-1.5 text-left text-xs font-medium transition-colors ${
                  activePreset === preset.id
                    ? 'bg-[#E8F0FE] text-[#1A73E8]'
                    : 'text-[#5F6368] hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActivePreset('custom')}
              className={`px-4 py-1.5 text-left text-xs font-medium transition-colors ${
                activePreset === 'custom'
                  ? 'bg-[#E8F0FE] text-[#1A73E8]'
                  : 'text-[#5F6368] hover:bg-gray-50'
              }`}
            >
              Custom range
            </button>
          </div>

          {/* Calendar for custom range */}
          <div className="p-2">
            <Calendar
              mode="range"
              selected={activePreset === 'custom' ? customRange : displayRange}
              onSelect={handleCustomSelect}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />
            {rangeError && (
              <p className="mt-1 px-2 text-xs text-red-500">{rangeError}</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
