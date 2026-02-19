import { beforeEach, describe, expect, it } from "vitest";

import {
  clearConnectorStores,
  listConnectors,
  listIntegrationRequests,
  requestIntegration,
  updateConnectorState
} from "@/lib/connectors/store";

describe("connector store", () => {
  beforeEach(() => {
    clearConnectorStores();
  });

  it("updates connector lifecycle state", () => {
    const connectors = listConnectors({ limit: 1 });
    const connector = connectors[0];

    const updated = updateConnectorState(connector.connectorKey, "connected");

    expect(updated?.lifecycleState).toBe("connected");
  });

  it("calculates integration request priority", () => {
    const first = requestIntegration({
      providerName: "Example Provider",
      requestedBy: "user-1",
      tenantId: "tenant-1",
      useCase: "Need campaign + conversion sync",
      businessImpact: 5,
      monthlySpendUsd: 5000
    });
    const second = requestIntegration({
      providerName: "Example Provider",
      requestedBy: "user-2",
      tenantId: "tenant-2",
      useCase: "Need unified reporting",
      businessImpact: 4,
      monthlySpendUsd: 12000
    });

    const requests = listIntegrationRequests();

    expect(requests).toHaveLength(2);
    expect(second.priorityScore).toBeGreaterThan(first.priorityScore - 10);
  });
});
