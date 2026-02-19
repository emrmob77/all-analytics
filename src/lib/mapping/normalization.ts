import { ApiError } from "@/lib/api/errors";
import type {
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
} from "@/lib/mapping/types";

const canonicalMetricAliases: Record<CanonicalMetricKey, string[]> = {
  impressions: ["impressions", "impr", "impression_count", "show_count"],
  clicks: ["clicks", "click", "click_count", "taps"],
  spend: ["spend", "cost", "amount_spent", "ad_spend"],
  conversions: ["conversions", "conversion", "total_conversions", "purchases"],
  revenue: ["revenue", "conversion_value", "purchase_value", "total_revenue"],
  ctr: ["ctr", "click_through_rate"],
  cpc: ["cpc", "cost_per_click"],
  cpa: ["cpa", "cost_per_action", "cost_per_conversion"],
  roas: ["roas", "return_on_ad_spend"],
  sessions: ["sessions", "session_count", "visits"],
  users: ["users", "unique_users", "active_users"]
};

const providerMetricAliasOverrides: Record<string, Record<string, CanonicalMetricKey>> = {
  "google-ads": {
    cost_micros: "spend",
    conversions_value: "revenue"
  },
  "meta-ads": {
    spend: "spend",
    actions: "conversions",
    purchase_roas: "roas"
  },
  "tiktok-ads": {
    stat_cost: "spend",
    conversion: "conversions"
  },
  ga4: {
    total_users: "users",
    event_count: "conversions"
  },
  "search-console": {
    ctr: "ctr",
    clicks: "clicks",
    impressions: "impressions"
  }
};

const attributionFieldAliasMap: Record<string, Record<keyof AttributionNormalizationResult, string[]>> = {
  default: {
    campaignId: ["campaign_id", "campaignId", "utm_campaign", "campaign"],
    adGroupId: ["ad_group_id", "adset_id", "adGroupId", "ad_group"],
    adId: ["ad_id", "creative_id", "adId"],
    source: ["source", "utm_source", "channel_source"],
    medium: ["medium", "utm_medium", "channel_medium"],
    clickId: ["click_id", "gclid", "fbclid", "ttclid", "msclkid"],
    conversionValue: ["conversion_value", "value", "revenue", "purchase_value"]
  },
  "google-ads": {
    campaignId: ["campaign_id"],
    adGroupId: ["ad_group_id"],
    adId: ["ad_id"],
    source: ["network", "source", "utm_source"],
    medium: ["utm_medium", "medium"],
    clickId: ["gclid"],
    conversionValue: ["conversion_value", "value"]
  },
  "meta-ads": {
    campaignId: ["campaign_id", "campaignId"],
    adGroupId: ["adset_id"],
    adId: ["ad_id"],
    source: ["platform", "source", "utm_source"],
    medium: ["placement", "utm_medium", "medium"],
    clickId: ["fbclid"],
    conversionValue: ["value", "conversion_value"]
  }
};

const currencyRatesToUsd: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  TRY: 0.031,
  CAD: 0.74,
  AUD: 0.66
};

const schemaVersions: SchemaVersionDescriptor[] = [
  {
    version: "1.0.0",
    releasedAt: "2024-01-15",
    notes: "Initial normalized marketing schema."
  },
  {
    version: "1.1.0",
    releasedAt: "2024-05-10",
    notes: "Attribution fields standardized and conversion value typed."
  },
  {
    version: "2.0.0",
    releasedAt: "2025-01-12",
    notes: "Cross-platform channel dimensions migrated to normalized dictionary ids."
  },
  {
    version: "2.1.0",
    releasedAt: "2025-09-20",
    notes: "Currency + timezone normalization metadata included in event payload."
  }
];

const schemaMigrationSteps: SchemaMigrationStep[] = [
  {
    fromVersion: "1.0.0",
    toVersion: "1.1.0",
    strategy: "transform",
    summary: "Backfill attribution aliases into canonical fields."
  },
  {
    fromVersion: "1.1.0",
    toVersion: "2.0.0",
    strategy: "breaking",
    summary: "Replace free-text channel dimensions with dictionary-backed ids."
  },
  {
    fromVersion: "2.0.0",
    toVersion: "2.1.0",
    strategy: "additive",
    summary: "Add normalized currency and timezone metadata columns."
  }
];

const currentSchemaVersion = schemaVersions[schemaVersions.length - 1]?.version ?? "1.0.0";

function normalizeMetricKey(inputKey: string): string {
  return inputKey.trim().toLowerCase().replace(/[^\w]+/g, "_");
}

function findCanonicalMetricForAlias(providerKey: string, rawMetricKey: string): CanonicalMetricKey | undefined {
  const normalizedKey = normalizeMetricKey(rawMetricKey);
  const providerOverrides = providerMetricAliasOverrides[providerKey] ?? {};

  if (providerOverrides[normalizedKey]) {
    return providerOverrides[normalizedKey];
  }

  for (const [canonicalKey, aliases] of Object.entries(canonicalMetricAliases) as Array<
    [CanonicalMetricKey, string[]]
  >) {
    if (aliases.includes(normalizedKey)) {
      return canonicalKey;
    }
  }

  return undefined;
}

function normalizeMetrics(input: MetricNormalizationInput): MetricNormalizationResult {
  const normalizedMetrics: Partial<Record<CanonicalMetricKey, number>> = {};
  const unmappedMetrics: Record<string, number> = {};

  for (const [rawMetricKey, metricValue] of Object.entries(input.metrics)) {
    const canonicalMetric = findCanonicalMetricForAlias(input.providerKey, rawMetricKey);

    if (!canonicalMetric) {
      unmappedMetrics[rawMetricKey] = metricValue;
      continue;
    }

    normalizedMetrics[canonicalMetric] = metricValue;
  }

  return {
    normalizedMetrics,
    unmappedMetrics
  };
}

function normalizeCurrency(input: CurrencyNormalizationInput): CurrencyNormalizationResult {
  const fromCurrency = input.fromCurrency.toUpperCase();
  const toCurrency = input.toCurrency.toUpperCase();

  const fromRate = currencyRatesToUsd[fromCurrency];
  const toRate = currencyRatesToUsd[toCurrency];

  if (!fromRate || !toRate) {
    throw new ApiError({
      status: 400,
      code: "UNSUPPORTED_CURRENCY",
      message: `Unsupported currency pair '${fromCurrency}' -> '${toCurrency}'.`,
      expose: true
    });
  }

  const usdAmount = input.amount * fromRate;
  const normalizedAmount = usdAmount / toRate;
  const exchangeRate = fromRate / toRate;

  return {
    amount: Number(normalizedAmount.toFixed(6)),
    fromCurrency,
    toCurrency,
    exchangeRate: Number(exchangeRate.toFixed(6))
  };
}

function parseLocalDateTime(timestamp: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} | null {
  const matched = timestamp.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!matched) {
    return null;
  }

  return {
    year: Number.parseInt(matched[1], 10),
    month: Number.parseInt(matched[2], 10),
    day: Number.parseInt(matched[3], 10),
    hour: Number.parseInt(matched[4], 10),
    minute: Number.parseInt(matched[5], 10),
    second: Number.parseInt(matched[6] ?? "0", 10)
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  const asUtcTimestamp = Date.UTC(
    Number.parseInt(map.year ?? "0", 10),
    Number.parseInt(map.month ?? "1", 10) - 1,
    Number.parseInt(map.day ?? "1", 10),
    Number.parseInt(map.hour ?? "0", 10),
    Number.parseInt(map.minute ?? "0", 10),
    Number.parseInt(map.second ?? "0", 10)
  );

  return asUtcTimestamp - date.getTime();
}

function convertLocalDateTimeToUtcIso(localTimestamp: string, timeZone: string): string {
  const parsedLocalDate = parseLocalDateTime(localTimestamp);

  if (!parsedLocalDate) {
    throw new ApiError({
      status: 400,
      code: "INVALID_TIMESTAMP",
      message: "Timestamp must be ISO string or local datetime (YYYY-MM-DDTHH:mm:ss).",
      expose: true
    });
  }

  const utcGuess = Date.UTC(
    parsedLocalDate.year,
    parsedLocalDate.month - 1,
    parsedLocalDate.day,
    parsedLocalDate.hour,
    parsedLocalDate.minute,
    parsedLocalDate.second
  );
  const offsetMs = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  const correctedUtcMs = utcGuess - offsetMs;

  return new Date(correctedUtcMs).toISOString();
}

function normalizeTimestampToUtc(input: TimezoneNormalizationInput): TimezoneNormalizationResult {
  const originalTimezone = input.timezone ?? "UTC";

  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(input.timestamp)) {
    const parsed = new Date(input.timestamp);

    if (Number.isNaN(parsed.getTime())) {
      throw new ApiError({
        status: 400,
        code: "INVALID_TIMESTAMP",
        message: "Timestamp is not a valid ISO datetime.",
        expose: true
      });
    }

    return {
      originalTimestamp: input.timestamp,
      originalTimezone,
      normalizedUtcTimestamp: parsed.toISOString()
    };
  }

  return {
    originalTimestamp: input.timestamp,
    originalTimezone,
    normalizedUtcTimestamp: convertLocalDateTimeToUtcIso(input.timestamp, originalTimezone)
  };
}

function findAttributionValue(
  attributionRecord: Record<string, unknown>,
  aliases: string[]
): unknown {
  for (const alias of aliases) {
    if (alias in attributionRecord) {
      return attributionRecord[alias];
    }

    const normalizedAlias = normalizeMetricKey(alias);
    for (const [existingKey, value] of Object.entries(attributionRecord)) {
      if (normalizeMetricKey(existingKey) === normalizedAlias) {
        return value;
      }
    }
  }

  return undefined;
}

function normalizeAttribution(
  input: AttributionNormalizationInput
): AttributionNormalizationResult {
  const providerAliasMap =
    attributionFieldAliasMap[input.providerKey] ?? attributionFieldAliasMap.default;
  const normalizedAttribution: AttributionNormalizationResult = {};

  for (const [field, aliases] of Object.entries(providerAliasMap) as Array<
    [keyof AttributionNormalizationResult, string[]]
  >) {
    const rawValue = findAttributionValue(input.attribution, aliases);

    if (typeof rawValue === "undefined" || rawValue === null || rawValue === "") {
      continue;
    }

    if (field === "conversionValue") {
      const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);

      if (Number.isFinite(numericValue)) {
        normalizedAttribution.conversionValue = numericValue;
      }

      continue;
    }

    normalizedAttribution[field] = String(rawValue);
  }

  return normalizedAttribution;
}

function compareVersions(leftVersion: string, rightVersion: string): number {
  const leftParts = leftVersion.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = rightVersion.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
}

function planSchemaMigration(
  fromVersion: string,
  toVersion = currentSchemaVersion
): SchemaMigrationStep[] {
  if (compareVersions(fromVersion, toVersion) === 0) {
    return [];
  }

  if (compareVersions(fromVersion, toVersion) > 0) {
    throw new ApiError({
      status: 400,
      code: "INVALID_SCHEMA_VERSION",
      message: "Downgrade migration planning is not supported.",
      expose: true
    });
  }

  const migrationPath: SchemaMigrationStep[] = [];
  let currentVersion = fromVersion;

  while (currentVersion !== toVersion) {
    const step = schemaMigrationSteps.find((candidateStep) => candidateStep.fromVersion === currentVersion);

    if (!step) {
      throw new ApiError({
        status: 400,
        code: "MIGRATION_PATH_NOT_FOUND",
        message: `No migration path from '${fromVersion}' to '${toVersion}'.`,
        expose: true
      });
    }

    migrationPath.push(step);
    currentVersion = step.toVersion;

    if (compareVersions(currentVersion, toVersion) > 0) {
      throw new ApiError({
        status: 400,
        code: "MIGRATION_PATH_NOT_FOUND",
        message: `Migration chain overshot target version '${toVersion}'.`,
        expose: true
      });
    }
  }

  return migrationPath;
}

function getSchemaVersions(): SchemaVersionDescriptor[] {
  return schemaVersions;
}

function getCurrentSchemaVersion(): string {
  return currentSchemaVersion;
}

export {
  getCurrentSchemaVersion,
  getSchemaVersions,
  normalizeAttribution,
  normalizeCurrency,
  normalizeMetrics,
  normalizeTimestampToUtc,
  planSchemaMigration
};
