'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [showCalendar, setShowCalendar] = useState(false);
  // tempRange tracks the in-progress calendar selection (from set, to pending)
  const [tempRange, setTempRange] = useState<DayPickerRange | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function closePanel() {
    setOpen(false);
    setShowCalendar(false);
    setTempRange(undefined);
    setError(null);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closePanel();
      }
    }

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

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

  function handleCustomClick() {
    // Toggle calendar; seed tempRange from current value
    setShowCalendar((v) => !v);
    setTempRange({ from: value.from, to: value.to });
    setError(null);
  }

  function handleCalendarSelect(range: DayPickerRange | undefined) {
    // react-day-picker v9 range mode: first click yields { from, to: undefined }.
    // Keep the panel open until the user picks the second date.
    setTempRange(range);
    setError(null);

    if (!range?.from || !range.to) return;

    const from = startOfDay(range.from);
    const to = startOfDay(range.to);
    const days = dateRangeDays({ from, to });

    if (days > MAX_DATE_RANGE_DAYS) {
      setError(`Max ${MAX_DATE_RANGE_DAYS} days. Please choose a shorter range.`);
      // Keep from, clear to so the user can re-pick the end date
      setTempRange({ from: range.from, to: undefined });
      return;
    }

    onChange({ from, to });
    closePanel();
  }

  const activePreset = PRESETS.find((p) => isSameDateRange(value, getPresetRange(p.value)));

  return (
    <div className="relative" ref={containerRef}>
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

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 rounded-xl border border-[#E3E8EF] bg-white shadow-lg">
          {/* Preset list */}
          <div className="min-w-[180px] p-2">
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

            <button
              onClick={handleCustomClick}
              className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                showCalendar
                  ? 'bg-[#E8F0FE] text-[#1A73E8]'
                  : 'text-[#5F6368] hover:bg-gray-50'
              }`}
            >
              Custom range
            </button>
          </div>

          {/* Calendar — shown only when Custom is selected */}
          {showCalendar && (
            <div className="border-t border-[#E3E8EF] p-2">
              {error && (
                <p className="mb-1 px-1 text-[11px] text-red-500">{error}</p>
              )}
              <Calendar
                mode="range"
                selected={tempRange ?? { from: value.from, to: value.to }}
                onSelect={handleCalendarSelect}
                disabled={{ after: new Date() }}
                numberOfMonths={1}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
