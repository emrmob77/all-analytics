type WebhookProvider = "shopify" | "hubspot" | "salesforce" | "meta" | "google";

type WebhookSignatureScheme = "base64-hmac-sha256" | "hex-hmac-sha256" | "sha256-prefixed-hex";

interface WebhookIngestionEvent {
  id: string;
  provider: WebhookProvider;
  eventType: string;
  sourceId?: string;
  receivedAt: string;
  payloadHash: string;
  payloadSize: number;
  status: "accepted" | "rejected";
  reason?: string;
}

interface WebhookDeadLetterEvent {
  id: string;
  provider: WebhookProvider;
  eventType: string;
  receivedAt: string;
  reason: string;
  payloadSnippet: string;
}

interface WebhookVerificationInput {
  provider: WebhookProvider;
  rawBody: string;
  signature: string;
}

interface WebhookVerificationResult {
  verified: boolean;
  scheme: WebhookSignatureScheme;
}

export type {
  WebhookDeadLetterEvent,
  WebhookIngestionEvent,
  WebhookProvider,
  WebhookSignatureScheme,
  WebhookVerificationInput,
  WebhookVerificationResult
};
