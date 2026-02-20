/**
 * Formats a number as a currency string.
 * e.g. formatCurrency(1234.5) → "$1,234.50"
 * e.g. formatCurrency(1234.5, 'EUR', 'de-DE') → "1.234,50 €"
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a number as a compact currency string.
 * e.g. formatCurrencyCompact(12345) → "$12.3K"
 * e.g. formatCurrencyCompact(1234567) → "$1.2M"
 */
export function formatCurrencyCompact(value: number, currency = 'USD'): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${formatCurrencySymbol(currency)}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${formatCurrencySymbol(currency)}${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value, currency);
}

/**
 * Returns just the currency symbol for a given ISO currency code.
 */
export function formatCurrencySymbol(currency = 'USD'): string {
  return (
    new Intl.NumberFormat('en-US', { style: 'currency', currency })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? '$'
  );
}

/**
 * Formats a number as a percentage.
 * e.g. formatPercent(1.69) → "1.69%"
 * e.g. formatPercent(1.69, 1) → "1.7%"
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats a large number with K / M / B abbreviation.
 * e.g. formatNumber(842000) → "842K"
 * e.g. formatNumber(1240000) → "1.2M"
 */
export function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString('en-US');
}

/**
 * Formats a raw number with comma separators.
 * e.g. formatInteger(842000) → "842,000"
 */
export function formatInteger(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

/**
 * Formats a ROAS (Return on Ad Spend) value.
 * e.g. formatRoas(4.2) → "4.2x"
 */
export function formatRoas(value: number): string {
  return `${value.toFixed(1)}x`;
}

/**
 * Formats a change value with a sign prefix.
 * e.g. formatChange(12.5) → "+12.5%"
 * e.g. formatChange(-3.2) → "-3.2%"
 */
export function formatChange(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}
