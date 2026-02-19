type CanonicalMetricKey =
  | "impressions"
  | "clicks"
  | "spend"
  | "conversions"
  | "revenue"
  | "ctr"
  | "cpc"
  | "cpa"
  | "roas"
  | "sessions"
  | "users";

interface MetricNormalizationInput {
  providerKey: string;
  metrics: Record<string, number>;
}

interface MetricNormalizationResult {
  normalizedMetrics: Partial<Record<CanonicalMetricKey, number>>;
  unmappedMetrics: Record<string, number>;
}

interface CurrencyNormalizationInput {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

interface CurrencyNormalizationResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
}

interface TimezoneNormalizationInput {
  timestamp: string;
  timezone?: string;
}

interface TimezoneNormalizationResult {
  originalTimestamp: string;
  originalTimezone: string;
  normalizedUtcTimestamp: string;
}

interface AttributionNormalizationInput {
  providerKey: string;
  attribution: Record<string, unknown>;
}

interface AttributionNormalizationResult {
  campaignId?: string;
  adGroupId?: string;
  adId?: string;
  source?: string;
  medium?: string;
  clickId?: string;
  conversionValue?: number;
}

interface SchemaVersionDescriptor {
  version: string;
  releasedAt: string;
  notes: string;
}

interface SchemaMigrationStep {
  fromVersion: string;
  toVersion: string;
  strategy: "additive" | "transform" | "breaking";
  summary: string;
}

export type {
  AttributionNormalizationInput,
  AttributionNormalizationResult,
  CanonicalMetricKey,
  CurrencyNormalizationInput,
  CurrencyNormalizationResult,
  MetricNormalizationInput,
  MetricNormalizationResult,
  SchemaMigrationStep,
  SchemaVersionDescriptor,
  TimezoneNormalizationInput,
  TimezoneNormalizationResult
};
