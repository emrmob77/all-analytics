import { createApiHandler } from "@/lib/api/handler";
import { readEnumParam, readIntegerParam } from "@/lib/api/validation";
import { listWebhookDeadLetters } from "@/lib/webhooks/store";

const webhookProviderValues = ["shopify", "hubspot", "salesforce", "meta", "google"] as const;

interface ListWebhookDeadLettersQueryDto {
  provider?: (typeof webhookProviderValues)[number];
  limit: number;
}

function parseListWebhookDeadLettersQuery(url: URL): ListWebhookDeadLettersQueryDto {
  const params = url.searchParams;

  return {
    provider: readEnumParam(params, "provider", webhookProviderValues),
    limit: readIntegerParam(params, "limit", { min: 1, max: 500 }) ?? 100
  };
}

export const GET = createApiHandler(async (request) => {
  const query = parseListWebhookDeadLettersQuery(new URL(request.url));
  const items = listWebhookDeadLetters(query);

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
    keyPrefix: "webhooks-deadletters-list"
  },
  audit: {
    action: "webhooks.dead_letters.list"
  }
});
