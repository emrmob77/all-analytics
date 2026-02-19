import { describe, expect, it } from "vitest";

import { getConnectorAdapter, listConnectorAdapters } from "@/lib/connectors/framework";

describe("connector framework", () => {
  it("builds provider-agnostic connector registry", async () => {
    const adapters = listConnectorAdapters();
    expect(adapters.length > 0).toBe(true);

    const first = adapters[0];
    const same = getConnectorAdapter(first.connectorKey);

    expect(same?.providerKey).toBe(first.providerKey);
    expect(first.version).toBe("1.0.0");
  });

  it("supports auth, sync, mapping and health methods", async () => {
    const adapter = listConnectorAdapters()[0];

    const authResult = await adapter.authorize({ mode: adapter.authModes[0] });
    const syncResult = await adapter.sync({ cursor: null });
    const mappedMetric = adapter.mapMetric({
      metricKey: "Total Spend",
      value: 123
    });
    const health = await adapter.checkHealth();

    expect(authResult.connected).toBe(true);
    expect(syncResult.processedRecords > 0).toBe(true);
    expect(mappedMetric.standardizedMetricKey).toBe("total_spend");
    expect(["healthy", "degraded", "down"]).toContain(health.status);
  });
});
