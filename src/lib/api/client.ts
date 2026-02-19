"use client";

import type { ApiEnvelope } from "@/lib/api/types";

class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(params: {
    message: string;
    status: number;
    code?: string;
    details?: unknown;
    requestId?: string;
  }) {
    super(params.message);
    this.name = "ApiClientError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.requestId = params.requestId;
  }
}

interface ApiClientSuccess<TData> {
  data: TData;
  requestId: string;
  meta: {
    durationMs: number;
    timestamp: string;
  };
}

async function parseApiEnvelope<TData>(response: Response): Promise<ApiEnvelope<TData>> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError({
      message: `API response is not valid JSON (status ${response.status}).`,
      status: response.status
    });
  }

  if (!payload || typeof payload !== "object") {
    throw new ApiClientError({
      message: `API response payload is malformed (status ${response.status}).`,
      status: response.status
    });
  }

  return payload as ApiEnvelope<TData>;
}

async function fetchApi<TData>(input: string | URL, init?: RequestInit): Promise<ApiClientSuccess<TData>> {
  const response = await fetch(input, init);
  const envelope = await parseApiEnvelope<TData>(response);

  if (!envelope.ok) {
    throw new ApiClientError({
      message: envelope.error.message,
      status: response.status,
      code: envelope.error.code,
      details: envelope.error.details,
      requestId: envelope.requestId
    });
  }

  return {
    data: envelope.data,
    requestId: envelope.requestId,
    meta: envelope.meta
  };
}

export { ApiClientError, fetchApi };
export type { ApiClientSuccess };
