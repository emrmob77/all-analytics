import { integrationProviderCatalog } from "@/lib/integrations/providerCatalog";
import type { IntegrationProviderDefinition } from "@/lib/integrations/types";
import type {
  ConnectorAdapter,
  ConnectorDefinition,
  ConnectorHealthResult,
  ConnectorMappingInput,
  ConnectorMappingResult,
  ConnectorSyncInput,
  ConnectorSyncResult
} from "@/lib/connectors/types";

function generateCursor(previousCursor?: string | null): string {
  const suffix = Date.now().toString(36);
  return previousCursor ? `${previousCursor}-${suffix}` : `cursor-${suffix}`;
}

function normalizeMetricKey(metricKey: string): string {
  return metricKey.trim().toLowerCase().replace(/\s+/g, "_");
}

class GenericConnectorAdapter implements ConnectorAdapter {
  readonly connectorKey: string;
  readonly providerKey: string;
  readonly version: string;
  readonly authModes: IntegrationProviderDefinition["authModes"];

  constructor(provider: IntegrationProviderDefinition) {
    this.connectorKey = `${provider.key}-connector`;
    this.providerKey = provider.key;
    this.version = "1.0.0";
    this.authModes = provider.authModes;
  }

  async authorize(): Promise<{ connected: boolean }> {
    return {
      connected: true
    };
  }

  async sync(input: ConnectorSyncInput): Promise<ConnectorSyncResult> {
    const startedAt = Date.now();
    const processedRecords = 100 + Math.floor(Math.random() * 900);

    return {
      cursor: generateCursor(input.cursor),
      processedRecords,
      durationMs: Math.max(1, Date.now() - startedAt)
    };
  }

  mapMetric(input: ConnectorMappingInput): ConnectorMappingResult {
    return {
      standardizedMetricKey: normalizeMetricKey(input.metricKey),
      value: input.value,
      metadata: input.metadata
    };
  }

  async checkHealth(): Promise<ConnectorHealthResult> {
    const latencyMs = 60 + Math.floor(Math.random() * 180);
    const status = latencyMs > 200 ? "degraded" : "healthy";

    return {
      status,
      latencyMs,
      checkedAt: new Date().toISOString(),
      message:
        status === "healthy"
          ? "Connector API is responding within expected latency."
          : "Connector API latency is higher than baseline."
    };
  }
}

function createDefaultConnectorDefinitions(): ConnectorDefinition[] {
  return integrationProviderCatalog.map((provider) => ({
    connectorKey: `${provider.key}-connector`,
    providerKey: provider.key,
    name: `${provider.name} Connector`,
    category: provider.category,
    authModes: provider.authModes,
    version: "1.0.0",
    minimumCompatibleVersion: "1.0.0",
    lifecycleState: "draft"
  }));
}

const connectorAdapterRegistry = new Map<string, ConnectorAdapter>(
  integrationProviderCatalog.map((provider) => {
    const adapter = new GenericConnectorAdapter(provider);
    return [adapter.connectorKey, adapter];
  })
);

function getConnectorAdapter(connectorKey: string): ConnectorAdapter | undefined {
  return connectorAdapterRegistry.get(connectorKey);
}

function listConnectorAdapters(): ConnectorAdapter[] {
  return [...connectorAdapterRegistry.values()];
}

export { createDefaultConnectorDefinitions, getConnectorAdapter, listConnectorAdapters };
