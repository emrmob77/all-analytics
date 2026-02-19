import type {
  WebhookDeadLetterEvent,
  WebhookIngestionEvent,
  WebhookProvider
} from "@/lib/webhooks/types";

const webhookEventStore: WebhookIngestionEvent[] = [];
const webhookDeadLetterStore: WebhookDeadLetterEvent[] = [];
const MAX_WEBHOOK_EVENTS = 10_000;
const MAX_WEBHOOK_DEAD_LETTERS = 5_000;

function buildId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function hashPayload(payload: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload)
  );
  return Buffer.from(digest).toString("hex");
}

async function recordWebhookEvent(input: {
  provider: WebhookProvider;
  eventType: string;
  sourceId?: string;
  payload: string;
  status: "accepted" | "rejected";
  reason?: string;
}): Promise<WebhookIngestionEvent> {
  const event: WebhookIngestionEvent = {
    id: buildId("webhook"),
    provider: input.provider,
    eventType: input.eventType,
    sourceId: input.sourceId,
    receivedAt: new Date().toISOString(),
    payloadHash: await hashPayload(input.payload),
    payloadSize: Buffer.byteLength(input.payload, "utf8"),
    status: input.status,
    reason: input.reason
  };

  webhookEventStore.unshift(event);
  if (webhookEventStore.length > MAX_WEBHOOK_EVENTS) {
    webhookEventStore.splice(MAX_WEBHOOK_EVENTS);
  }

  return event;
}

function listWebhookEvents(filters?: {
  provider?: WebhookProvider;
  status?: WebhookIngestionEvent["status"];
  limit?: number;
}): WebhookIngestionEvent[] {
  const limit = filters?.limit ?? 100;

  return webhookEventStore
    .filter((event) => {
      if (filters?.provider && event.provider !== filters.provider) {
        return false;
      }

      if (filters?.status && event.status !== filters.status) {
        return false;
      }

      return true;
    })
    .slice(0, Math.max(0, limit));
}

function recordWebhookDeadLetter(input: {
  provider: WebhookProvider;
  eventType: string;
  reason: string;
  payload: string;
}): WebhookDeadLetterEvent {
  const deadLetter: WebhookDeadLetterEvent = {
    id: buildId("webhook_dead"),
    provider: input.provider,
    eventType: input.eventType,
    receivedAt: new Date().toISOString(),
    reason: input.reason,
    payloadSnippet: input.payload.slice(0, 2000)
  };

  webhookDeadLetterStore.unshift(deadLetter);
  if (webhookDeadLetterStore.length > MAX_WEBHOOK_DEAD_LETTERS) {
    webhookDeadLetterStore.splice(MAX_WEBHOOK_DEAD_LETTERS);
  }

  return deadLetter;
}

function listWebhookDeadLetters(filters?: {
  provider?: WebhookProvider;
  limit?: number;
}): WebhookDeadLetterEvent[] {
  const limit = filters?.limit ?? 100;

  return webhookDeadLetterStore
    .filter((event) => {
      if (filters?.provider && event.provider !== filters.provider) {
        return false;
      }

      return true;
    })
    .slice(0, Math.max(0, limit));
}

function clearWebhookStores(): void {
  webhookEventStore.splice(0, webhookEventStore.length);
  webhookDeadLetterStore.splice(0, webhookDeadLetterStore.length);
}

export {
  clearWebhookStores,
  listWebhookDeadLetters,
  listWebhookEvents,
  recordWebhookDeadLetter,
  recordWebhookEvent
};
