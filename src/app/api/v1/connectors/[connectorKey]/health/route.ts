import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { getConnectorAdapter } from "@/lib/connectors/framework";
import { setConnectorHealth } from "@/lib/connectors/store";

function parseConnectorKeyFromPath(url: URL): string {
  const matched = url.pathname.match(/\/api\/v1\/connectors\/([^/]+)\/health$/);

  if (!matched?.[1]) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Could not resolve connector key from path.",
      expose: true
    });
  }

  return decodeURIComponent(matched[1]);
}

export const POST = createApiHandler(async (_request, context) => {
  const connectorKey = parseConnectorKeyFromPath(context.url);
  const connectorAdapter = getConnectorAdapter(connectorKey);

  if (!connectorAdapter) {
    throw new ApiError({
      status: 404,
      code: "CONNECTOR_NOT_FOUND",
      message: `Connector '${connectorKey}' not found.`,
      expose: true
    });
  }

  const health = await connectorAdapter.checkHealth();
  const connector = setConnectorHealth(connectorKey, health);

  if (!connector) {
    throw new ApiError({
      status: 404,
      code: "CONNECTOR_NOT_FOUND",
      message: `Connector '${connectorKey}' not found in store.`,
      expose: true
    });
  }

  return {
    data: {
      connector,
      health
    }
  };
}, {
  auth: {
    required: true,
    roles: ["owner", "admin"]
  },
  rateLimit: {
    limit: 30,
    windowMs: 60_000,
    keyPrefix: "connectors-health"
  },
  audit: {
    action: "connectors.health.check"
  }
});
