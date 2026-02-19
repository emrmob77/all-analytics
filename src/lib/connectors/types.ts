import type { IntegrationAuthMode, IntegrationCategory } from "@/lib/integrations/types";

const connectorLifecycleStateValues = ["draft", "connected", "syncing", "paused", "failed"] as const;
type ConnectorLifecycleState = (typeof connectorLifecycleStateValues)[number];

const connectorHealthStatusValues = ["healthy", "degraded", "down"] as const;
type ConnectorHealthStatus = (typeof connectorHealthStatusValues)[number];

interface ConnectorSyncInput {
  cursor?: string | null;
  fullSync?: boolean;
}

interface ConnectorSyncResult {
  cursor: string | null;
  processedRecords: number;
  durationMs: number;
}

interface ConnectorMappingInput {
  metricKey: string;
  value: number;
  metadata?: Record<string, unknown>;
}

interface ConnectorMappingResult {
  standardizedMetricKey: string;
  value: number;
  metadata?: Record<string, unknown>;
}

interface ConnectorHealthResult {
  status: ConnectorHealthStatus;
  latencyMs: number;
  checkedAt: string;
  message: string;
}

interface ConnectorAdapter {
  connectorKey: string;
  providerKey: string;
  version: string;
  authModes: IntegrationAuthMode[];
  authorize(input: { mode: IntegrationAuthMode; tenantId?: string }): Promise<{ connected: boolean }>;
  sync(input: ConnectorSyncInput): Promise<ConnectorSyncResult>;
  mapMetric(input: ConnectorMappingInput): ConnectorMappingResult;
  checkHealth(): Promise<ConnectorHealthResult>;
}

interface ConnectorDefinition {
  connectorKey: string;
  providerKey: string;
  name: string;
  category: IntegrationCategory;
  authModes: IntegrationAuthMode[];
  version: string;
  minimumCompatibleVersion: string;
  lifecycleState: ConnectorLifecycleState;
}

interface IntegrationRequest {
  id: string;
  providerName: string;
  requestedBy: string;
  tenantId: string;
  useCase: string;
  businessImpact: number;
  monthlySpendUsd?: number;
  priorityScore: number;
  status: "queued" | "planned" | "declined";
  createdAt: string;
}

export { connectorHealthStatusValues, connectorLifecycleStateValues };
export type {
  ConnectorAdapter,
  ConnectorDefinition,
  ConnectorHealthResult,
  ConnectorHealthStatus,
  ConnectorLifecycleState,
  ConnectorMappingInput,
  ConnectorMappingResult,
  ConnectorSyncInput,
  ConnectorSyncResult,
  IntegrationRequest
};
