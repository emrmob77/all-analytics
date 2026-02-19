interface NumberOptions {
  locale?: string;
  maximumFractionDigits?: number;
}

interface CurrencyOptions extends NumberOptions {
  currency?: string;
}

type PercentageOptions = NumberOptions;

function toDate(date: Date | string | number) {
  return date instanceof Date ? date : new Date(date);
}

export function formatCurrency(value: number, options: CurrencyOptions = {}) {
  const { currency = "USD", locale = "en-US", maximumFractionDigits = 0 } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits
  }).format(value);
}

export function formatNumber(value: number, options: NumberOptions = {}) {
  const { locale = "en-US", maximumFractionDigits = 1 } = options;

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits
  }).format(value);
}

export function formatPercentage(value: number, options: PercentageOptions = {}) {
  const { locale = "en-US", maximumFractionDigits = 1 } = options;

  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits
  }).format(value);
}

export function formatDate(date: Date | string | number, locale = "en-US") {
  const parsedDate = toDate(date);

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(parsedDate);
}

export function formatRelativeTime(date: Date | string | number, locale = "en-US") {
  const parsedDate = toDate(date);
  const now = Date.now();
  const diffMs = parsedDate.getTime() - now;

  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 1000 * 60 * 60 * 24 * 365, unit: "year" },
    { amount: 1000 * 60 * 60 * 24 * 30, unit: "month" },
    { amount: 1000 * 60 * 60 * 24 * 7, unit: "week" },
    { amount: 1000 * 60 * 60 * 24, unit: "day" },
    { amount: 1000 * 60 * 60, unit: "hour" },
    { amount: 1000 * 60, unit: "minute" },
    { amount: 1000, unit: "second" }
  ];

  const relativeTime = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const division of divisions) {
    if (Math.abs(diffMs) >= division.amount || division.unit === "second") {
      const value = Math.round(diffMs / division.amount);
      return relativeTime.format(value, division.unit);
    }
  }

  return relativeTime.format(0, "second");
}
