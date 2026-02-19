import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString, readStringParam } from "@/lib/api/validation";
import {
  createSupportTicket,
  getDefaultTenantId,
  listSupportTickets,
  type SupportPriority
} from "@/lib/saas/store";

const priorities = ["low", "medium", "high"] as const;
const categories = ["technical", "billing", "integration", "general"] as const;

function asPriority(value: string | undefined): SupportPriority {
  if (!value) return "medium";
  return priorities.includes(value as (typeof priorities)[number]) ? (value as SupportPriority) : "medium";
}

function asCategory(value: string | undefined): "technical" | "billing" | "integration" | "general" {
  if (!value) return "general";
  return categories.includes(value as (typeof categories)[number])
    ? (value as "technical" | "billing" | "integration" | "general")
    : "general";
}

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);
  const tenantId = readStringParam(url.searchParams, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId();

  return {
    data: {
      tickets: listSupportTickets(tenantId)
    }
  };
});

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const ticket = createSupportTicket({
    tenantId: readBodyString(body, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId(),
    subject: readBodyString(body, "subject", { required: true, minLength: 4, maxLength: 160 }) ?? "",
    category: asCategory(readBodyString(body, "category", { maxLength: 30 })),
    priority: asPriority(readBodyString(body, "priority", { maxLength: 20 })),
    description: readBodyString(body, "description", { required: true, minLength: 8, maxLength: 2000 }) ?? ""
  });

  return {
    data: {
      ticket
    },
    status: 201
  };
}, {
  audit: {
    action: "support.ticket.create"
  }
});
