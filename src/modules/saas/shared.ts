"use client";

import type { ApiEnvelope } from "@/lib/api/types";

async function requestApi<TData>(input: RequestInfo | URL, init?: RequestInit): Promise<TData> {
  const response = await fetch(input, init);
  const payload = (await response.json()) as ApiEnvelope<TData>;

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

function toCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export { requestApi, toCurrency };
