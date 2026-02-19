import { formatCurrency, formatNumber, formatPercentage } from "@/utils/formatters";

interface FormatValueOptions {
  style?: "number" | "currency" | "percent";
  currency?: string;
  maximumFractionDigits?: number;
}

export function formatValue(value: number, options: FormatValueOptions = {}) {
  const { style = "number", currency = "USD", maximumFractionDigits = 1 } = options;

  if (style === "currency") {
    return formatCurrency(value, { currency, maximumFractionDigits });
  }

  if (style === "percent") {
    return formatPercentage(value, { maximumFractionDigits });
  }

  return formatNumber(value, { maximumFractionDigits });
}
