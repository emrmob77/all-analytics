import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import {
  ensureObjectRecord,
  readBodyString
} from "@/lib/api/validation";
import {
  getCurrentSchemaVersion,
  normalizeAttribution,
  normalizeCurrency,
  normalizeMetrics,
  normalizeTimestampToUtc,
  planSchemaMigration
} from "@/lib/mapping/normalization";

interface NormalizePayloadDto {
  providerKey: string;
  metrics: Record<string, number>;
  currency?: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
  };
  time?: {
    timestamp: string;
    timezone?: string;
  };
  attribution?: Record<string, unknown>;
  schema?: {
    sourceVersion?: string;
    targetVersion?: string;
  };
}

function toNumberOrThrow(value: unknown, field: string): number {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: `Invalid '${field}' parameter: must be a finite number.`,
      expose: true
    });
  }

  return numericValue;
}

function parseMetricsRecord(value: unknown): Record<string, number> {
  const record = ensureObjectRecord(value, "metrics");
  const parsedRecord: Record<string, number> = {};

  for (const [key, recordValue] of Object.entries(record)) {
    parsedRecord[key] = toNumberOrThrow(recordValue, `metrics.${key}`);
  }

  return parsedRecord;
}

function parseNormalizePayload(payload: unknown): NormalizePayloadDto {
  const record = ensureObjectRecord(payload);
  const providerKey = readBodyString(record, "providerKey", {
    required: true,
    maxLength: 120
  }) as string;
  const metrics = parseMetricsRecord(record.metrics);

  const currencyRecord =
    typeof record.currency === "undefined" ? undefined : ensureObjectRecord(record.currency, "currency");
  const timeRecord = typeof record.time === "undefined" ? undefined : ensureObjectRecord(record.time, "time");
  const schemaRecord =
    typeof record.schema === "undefined" ? undefined : ensureObjectRecord(record.schema, "schema");

  return {
    providerKey,
    metrics,
    currency: currencyRecord
      ? {
          amount: toNumberOrThrow(currencyRecord.amount, "currency.amount"),
          fromCurrency: readBodyString(currencyRecord, "fromCurrency", {
            required: true,
            maxLength: 8
          }) as string,
          toCurrency:
            readBodyString(currencyRecord, "toCurrency", {
              maxLength: 8
            }) ?? "USD"
        }
      : undefined,
    time: timeRecord
      ? {
          timestamp: readBodyString(timeRecord, "timestamp", {
            required: true,
            maxLength: 64
          }) as string,
          timezone: readBodyString(timeRecord, "timezone", {
            maxLength: 64
          })
        }
      : undefined,
    attribution:
      typeof record.attribution === "undefined"
        ? undefined
        : ensureObjectRecord(record.attribution, "attribution"),
    schema: schemaRecord
      ? {
          sourceVersion: readBodyString(schemaRecord, "sourceVersion", {
            maxLength: 16
          }),
          targetVersion: readBodyString(schemaRecord, "targetVersion", {
            maxLength: 16
          })
        }
      : undefined
  };
}

export const POST = createApiHandler(async (_request, context) => {
  const payload = parseNormalizePayload(await context.readJson<unknown>());
  const normalizedMetrics = normalizeMetrics({
    providerKey: payload.providerKey,
    metrics: payload.metrics
  });
  const normalizedCurrency = payload.currency ? normalizeCurrency(payload.currency) : undefined;
  const normalizedTime = payload.time ? normalizeTimestampToUtc(payload.time) : undefined;
  const normalizedAttribution = payload.attribution
    ? normalizeAttribution({
        providerKey: payload.providerKey,
        attribution: payload.attribution
      })
    : undefined;

  const currentVersion = getCurrentSchemaVersion();
  const sourceVersion = payload.schema?.sourceVersion;
  const targetVersion = payload.schema?.targetVersion ?? currentVersion;
  const migrationPlan = sourceVersion ? planSchemaMigration(sourceVersion, targetVersion) : [];

  return {
    data: {
      providerKey: payload.providerKey,
      normalizedMetrics: normalizedMetrics.normalizedMetrics,
      unmappedMetrics: normalizedMetrics.unmappedMetrics,
      currency: normalizedCurrency,
      time: normalizedTime,
      attribution: normalizedAttribution,
      schema: {
        currentVersion,
        sourceVersion: sourceVersion ?? currentVersion,
        targetVersion,
        migrationPlan
      }
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 100,
    windowMs: 60_000,
    keyPrefix: "mapping-normalize"
  },
  audit: {
    action: "mapping.normalize"
  }
});
