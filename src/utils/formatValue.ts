interface FormatValueOptions {
  style?: "number" | "currency" | "percent";
  currency?: string;
  maximumFractionDigits?: number;
}

export function formatValue(value: number, options: FormatValueOptions = {}) {
  const { style = "number", currency = "USD", maximumFractionDigits = 1 } = options;

  if (style === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits
    }).format(value);
  }

  if (style === "percent") {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      maximumFractionDigits
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}
