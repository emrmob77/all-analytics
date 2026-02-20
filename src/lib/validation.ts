import type { DateRange } from '@/types';

/** Maximum allowed date range in days (per requirements). */
export const MAX_DATE_RANGE_DAYS = 365;

/**
 * Returns true if the string is a valid email address.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Returns true if the budget value is valid (a positive finite number).
 */
export function isValidBudget(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/**
 * Returns true if the DateRange is valid:
 * - `from` is not after `to`
 * - span does not exceed MAX_DATE_RANGE_DAYS
 */
export function isValidDateRange(range: DateRange): boolean {
  const from = range.from.getTime();
  const to = range.to.getTime();

  if (from > to) return false;

  const days = Math.round((to - from) / 86_400_000) + 1;
  return days <= MAX_DATE_RANGE_DAYS;
}

/**
 * Returns a human-readable error message for a DateRange, or null if valid.
 */
export function dateRangeError(range: DateRange): string | null {
  if (range.from.getTime() > range.to.getTime()) {
    return 'Start date must be before end date.';
  }

  const days = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000) + 1;
  if (days > MAX_DATE_RANGE_DAYS) {
    return `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days.`;
  }

  return null;
}

/**
 * Returns a human-readable error message for a budget value, or null if valid.
 */
export function budgetError(value: number): string | null {
  if (!Number.isFinite(value)) return 'Budget must be a number.';
  if (value <= 0) return 'Budget must be greater than 0.';
  return null;
}

/**
 * Returns a human-readable error message for an email, or null if valid.
 */
export function emailError(value: string): string | null {
  if (!value.trim()) return 'Email is required.';
  if (!isValidEmail(value)) return 'Please enter a valid email address.';
  return null;
}
