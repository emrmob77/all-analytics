'use client';

import { useState, useEffect } from 'react';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange, DateRangePreset } from '@/types';
import {
  getPresetRange,
  formatDateRange,
  isSameDateRange,
  dateRangeDays,
  startOfDay,
} from '@/lib/date';
import { MAX_DATE_RANGE_DAYS } from '@/lib/validation';

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last7days' },
  { label: 'Last 30 days', value: 'last30days' },
  { label: 'Last 90 days', value: 'last90days' },
];

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // tempRange: in-progress calendar selection — from picked, to still pending
  const [tempRange, setTempRange] = useState<DayPickerRange | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  function closePanel() {
    setOpen(false);
    setTempRange(undefined);
    setError(null);
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function handlePreset(preset: DateRangePreset) {
    onChange(getPresetRange(preset));
    closePanel();
  }

  function handleCalendarSelect(range: DayPickerRange | undefined) {
    // react-day-picker v9 range mode:
    //   1st click → { from: date, to: undefined }  — keep panel open, show selection
    //   2nd click → { from: date1, to: date2 }     — validate & commit
    setTempRange(range);
    setError(null);

    if (!range?.from || !range.to) return; // waiting for second date

    const from = startOfDay(range.from);
    const to = startOfDay(range.to);
    const days = dateRangeDays({ from, to });

    if (days > MAX_DATE_RANGE_DAYS) {
      setError(`Max ${MAX_DATE_RANGE_DAYS} days allowed.`);
      setTempRange({ from: range.from, to: undefined });
      return;
    }

    onChange({ from, to });
    closePanel();
  }

  const activePreset = PRESETS.find((p) => isSameDateRange(value, getPresetRange(p.value)));

  // Calendar shows tempRange while selecting, falls back to committed value
  const calendarSelected: DayPickerRange = tempRange ?? { from: value.from, to: value.to };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-[#E3E8EF] bg-white px-3.5 py-[7px] text-xs font-medium text-[#5F6368] transition-colors hover:bg-gray-50"
      >
        <svg
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <rect x="1" y="2" width="11" height="10" rx="1.5" />
          <path d="M1 5h11M4 1v2M8 1v2" />
        </svg>
        <span>{activePreset ? activePreset.label : formatDateRange(value)}</span>
      </button>

      {open && (
        <>
          {/*
           * Backdrop — z-40, covers entire viewport.
           * Clicking outside the panel closes it.
           * react-day-picker v9 re-renders the calendar DOM on every date click,
           * removing the clicked node before a document mousedown listener fires.
           * The backdrop approach avoids that race condition entirely.
           */}
          <div className="fixed inset-0 z-40" onClick={closePanel} />

          {/* Dropdown panel — z-50, above backdrop */}
          <div className="absolute right-0 top-full z-50 mt-1.5 flex rounded-xl border border-[#E3E8EF] bg-white shadow-lg">

            {/* LEFT: Calendar */}
            <div className="p-3">
              {error && (
                <p className="mb-1 px-1 text-[11px] text-red-500">{error}</p>
              )}
              <Calendar
                mode="range"
                selected={calendarSelected}
                onSelect={handleCalendarSelect}
                disabled={{ after: new Date() }}
                numberOfMonths={1}
              />
            </div>

            {/* Divider */}
            <div className="w-px bg-[#E3E8EF]" />

            {/* RIGHT: Presets */}
            <div className="flex w-[148px] flex-col gap-0.5 p-2">
              <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-[#9AA0A6]">
                Quick select
              </p>
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePreset(p.value)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                    activePreset?.value === p.value
                      ? 'bg-[#E8F0FE] text-[#1A73E8]'
                      : 'text-[#5F6368] hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
