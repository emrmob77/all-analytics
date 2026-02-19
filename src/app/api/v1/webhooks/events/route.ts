import { createApiHandler } from "@/lib/api/handler";
import { readEnumParam, readIntegerParam } from "@/lib/api/validation";
import { listWebhookEvents } from "@/lib/webhooks/store";

const webhookProviderValues = ["shopify", "hubspot", "salesforce", "meta", "google"] as const;
const webhookStatusValues = ["accepted", "rejected"] as const;

interface ListWebhookEventsQueryDto {
  provider?: (typeof webhookProviderValues)[number];
  status?: (typeof webhookStatusValues)[number];
  limit: number;
}

function parseListWebhookEventsQuery(url: URL): ListWebhookEventsQueryDto {
  const params = url.searchParams;

  return {
    provider: readEnumParam(params, "provider", webhookProviderValues),
    status: readEnumParam(params, "status", webhookStatusValues),
    limit: readIntegerParam(params, "limit", { min: 1, max: 500 }) ?? 100
  };
}

export const GET = createApiHandler(async (request) => {
  const query = parseListWebhookEventsQuery(new URL(request.url));
  const items = listWebhookEvents(query);

  return {
    data: {
      items,
      count: items.length,
      filters: query
    }
  };
}, {
  auth: {
    required: true,
    roles: ["owner", "admin"]
  },
  rateLimit: {
    limit: 60,
    windowMs: 60_000,
    keyPrefix: "webhooks-events-list"
  },
  audit: {
    action: "webhooks.events.list"
  }
});
