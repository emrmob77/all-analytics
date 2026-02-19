import { createDefaultConnectorDefinitions } from "@/lib/connectors/framework";
import type {
  ConnectorDefinition,
  ConnectorHealthResult,
  ConnectorLifecycleState,
  IntegrationRequest
} from "@/lib/connectors/types";

interface ConnectorRecord extends ConnectorDefinition {
  updatedAt: string;
  lastHealthCheck?: ConnectorHealthResult;
}

interface RequestIntegrationInput {
  providerName: string;
  requestedBy: string;
  tenantId: string;
  useCase: string;
  businessImpact: number;
  monthlySpendUsd?: number;
}

function buildId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function createConnectorStore(): Map<string, ConnectorRecord> {
  const createdAt = new Date().toISOString();
  const records = createDefaultConnectorDefinitions().map((connector) => [
    connector.connectorKey,
    {
      ...connector,
      updatedAt: createdAt
    }
  ] as const);

  return new Map(records);
}

const connectorStore = createConnectorStore();
const integrationRequestStore: IntegrationRequest[] = [];

function listConnectors(filters?: {
  search?: string;
  category?: ConnectorDefinition["category"];
  lifecycleState?: ConnectorLifecycleState;
  limit?: number;
}): ConnectorRecord[] {
  const normalizedSearch = filters?.search?.trim().toLowerCase();
  const limit = filters?.limit ?? 200;

  return [...connectorStore.values()]
    .filter((connector) => {
      if (filters?.category && connector.category !== filters.category) {
        return false;
      }

      if (filters?.lifecycleState && connector.lifecycleState !== filters.lifecycleState) {
        return false;
      }

      if (
        normalizedSearch &&
        !connector.name.toLowerCase().includes(normalizedSearch) &&
        !connector.providerKey.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      return true;
    })
    .slice(0, Math.max(0, limit));
}

function getConnector(connectorKey: string): ConnectorRecord | undefined {
  return connectorStore.get(connectorKey);
}

function updateConnectorState(
  connectorKey: string,
  lifecycleState: ConnectorLifecycleState
): ConnectorRecord | undefined {
  const current = connectorStore.get(connectorKey);
  if (!current) {
    return undefined;
  }

  const updated: ConnectorRecord = {
    ...current,
    lifecycleState,
    updatedAt: new Date().toISOString()
  };

  connectorStore.set(connectorKey, updated);
  return updated;
}

function setConnectorHealth(
  connectorKey: string,
  health: ConnectorHealthResult
): ConnectorRecord | undefined {
  const current = connectorStore.get(connectorKey);
  if (!current) {
    return undefined;
  }

  const updated: ConnectorRecord = {
    ...current,
    lastHealthCheck: health,
    lifecycleState: health.status === "down" ? "failed" : current.lifecycleState,
    updatedAt: new Date().toISOString()
  };

  connectorStore.set(connectorKey, updated);
  return updated;
}

function calculateRequestPriorityScore(input: RequestIntegrationInput): number {
  const impactScore = Math.max(1, Math.min(5, input.businessImpact)) * 20;
  const spendScore = Math.min(50, Math.floor((input.monthlySpendUsd ?? 0) / 1000));
  const duplicateCount = integrationRequestStore.filter(
    (request) => request.providerName.toLowerCase() === input.providerName.toLowerCase()
  ).length;
  const demandScore = Math.min(30, duplicateCount * 5);

  return impactScore + spendScore + demandScore;
}

function requestIntegration(input: RequestIntegrationInput): IntegrationRequest {
  const request: IntegrationRequest = {
    id: buildId("integration_request"),
    providerName: input.providerName.trim(),
    requestedBy: input.requestedBy.trim(),
    tenantId: input.tenantId.trim(),
    useCase: input.useCase.trim(),
    businessImpact: Math.max(1, Math.min(5, input.businessImpact)),
    monthlySpendUsd: input.monthlySpendUsd,
    priorityScore: calculateRequestPriorityScore(input),
    status: "queued",
    createdAt: new Date().toISOString()
  };

  integrationRequestStore.unshift(request);
  return request;
}

function listIntegrationRequests(filters?: { tenantId?: string; limit?: number }): IntegrationRequest[] {
  const limit = filters?.limit ?? 100;

  return integrationRequestStore
    .filter((request) => {
      if (filters?.tenantId && request.tenantId !== filters.tenantId) {
        return false;
      }

      return true;
    })
    .slice(0, Math.max(0, limit));
}

function clearConnectorStores(): void {
  connectorStore.clear();
  for (const connector of createDefaultConnectorDefinitions()) {
    connectorStore.set(connector.connectorKey, {
      ...connector,
      updatedAt: new Date().toISOString()
    });
  }
  integrationRequestStore.splice(0, integrationRequestStore.length);
}

export {
  clearConnectorStores,
  getConnector,
  listConnectors,
  listIntegrationRequests,
  requestIntegration,
  setConnectorHealth,
  updateConnectorState
};
export type { ConnectorRecord, RequestIntegrationInput };
