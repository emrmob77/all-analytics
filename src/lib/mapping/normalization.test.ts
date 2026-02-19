import { describe, expect, it } from "vitest";

import {
  getCurrentSchemaVersion,
  normalizeAttribution,
  normalizeCurrency,
  normalizeMetrics,
  normalizeTimestampToUtc,
  planSchemaMigration
} from "@/lib/mapping/normalization";

describe("mapping normalization", () => {
  it("normalizes metric aliases into canonical metric keys", () => {
    const result = normalizeMetrics({
      providerKey: "google-ads",
      metrics: {
        impressions: 1000,
        clicks: 120,
        cost_micros: 45.2,
        custom_metric: 99
      }
    });

    expect(result.normalizedMetrics.impressions).toBe(1000);
    expect(result.normalizedMetrics.clicks).toBe(120);
    expect(result.normalizedMetrics.spend).toBe(45.2);
    expect(result.unmappedMetrics.custom_metric).toBe(99);
  });

  it("normalizes currency and timezone values", () => {
    const currency = normalizeCurrency({
      amount: 100,
      fromCurrency: "EUR",
      toCurrency: "USD"
    });
    const time = normalizeTimestampToUtc({
      timestamp: "2026-02-19T10:30:00",
      timezone: "Europe/Berlin"
    });

    expect(currency.toCurrency).toBe("USD");
    expect(currency.amount > 0).toBe(true);
    expect(time.normalizedUtcTimestamp.endsWith("Z")).toBe(true);
  });

  it("normalizes attribution fields and schema migration path", () => {
    const attribution = normalizeAttribution({
      providerKey: "meta-ads",
      attribution: {
        campaign_id: "cmp_1",
        adset_id: "adset_2",
        ad_id: "ad_3",
        fbclid: "fbclid_123",
        value: "42.4"
      }
    });
    const migrationPlan = planSchemaMigration("1.0.0", getCurrentSchemaVersion());

    expect(attribution.campaignId).toBe("cmp_1");
    expect(attribution.adGroupId).toBe("adset_2");
    expect(attribution.clickId).toBe("fbclid_123");
    expect(attribution.conversionValue).toBe(42.4);
    expect(migrationPlan.length > 0).toBe(true);
  });
});
