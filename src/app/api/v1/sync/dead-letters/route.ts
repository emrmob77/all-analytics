import { createApiHandler } from "@/lib/api/handler";
import { readIntegerParam, readStringParam } from "@/lib/api/validation";
import { listDeadLetters } from "@/lib/sync/store";

interface ListDeadLetterQueryDto {
  jobId?: string;
  providerKey?: string;
  limit: number;
}

function parseListDeadLetterQuery(url: URL): ListDeadLetterQueryDto {
  const params = url.searchParams;

  return {
    jobId: readStringParam(params, "jobId", { maxLength: 120 }),
    providerKey: readStringParam(params, "providerKey", { maxLength: 80 }),
    limit: readIntegerParam(params, "limit", { min: 1, max: 200 }) ?? 100
  };
}

export const GET = createApiHandler(async (request) => {
  const query = parseListDeadLetterQuery(new URL(request.url));
  const items = listDeadLetters(query);

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
    keyPrefix: "sync-dead-letters"
  },
  audit: {
    action: "sync.dead_letters.list"
  }
});
