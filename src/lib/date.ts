import type { DateRange, DateRangePreset } from '@/types';

/**
 * Returns a DateRange for the given preset relative to today.
 */
export function getPresetRange(preset: DateRangePreset): DateRange {
  const today = startOfDay(new Date());

  switch (preset) {
    case 'today':
      return { from: today, to: today };

    case 'yesterday': {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }

    case 'last7days':
      return { from: addDays(today, -6), to: today };

    case 'last30days':
      return { from: addDays(today, -29), to: today };

    case 'last90days':
      return { from: addDays(today, -89), to: today };
  }
}

/**
 * Formats a date as "Jan 1, 2025".
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date as "Jan 1" (no year).
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a DateRange as "Jan 1 – Jan 31, 2025".
 * If both dates are in the same year, year is shown only once.
 */
export function formatDateRange(range: DateRange): string {
  const sameYear = range.from.getFullYear() === range.to.getFullYear();

  if (sameYear) {
    return `${formatDateShort(range.from)} – ${formatDate(range.to)}`;
  }

  return `${formatDate(range.from)} – ${formatDate(range.to)}`;
}

/**
 * Returns true if two DateRange objects represent the same range (day-level).
 */
export function isSameDateRange(a: DateRange, b: DateRange): boolean {
  return (
    startOfDay(a.from).getTime() === startOfDay(b.from).getTime() &&
    startOfDay(a.to).getTime() === startOfDay(b.to).getTime()
  );
}

/**
 * Returns the number of days in a DateRange (inclusive).
 */
export function dateRangeDays(range: DateRange): number {
  const ms = startOfDay(range.to).getTime() - startOfDay(range.from).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/**
 * Returns a Date with time zeroed to midnight (local).
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Adds `days` days to a date (can be negative).
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Returns "X days ago", "yesterday", "today", etc. relative to now.
 */
export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

/**
 * Formats a Date as "HH:mm" (24-hour clock).
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
