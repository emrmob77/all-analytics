"use client";

import { useMutation } from "@tanstack/react-query";

import { fetchApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";

interface OAuthStartInput {
  providerKey: string;
  redirectUri: string;
  brandId?: string;
}

interface OAuthStartResult {
  provider: {
    key: string;
    name: string;
  };
  authMode: "oauth2";
  redirectUri: string;
  authorizationUrl: string;
  state: string;
  scopes: string[];
  refreshToken: {
    supported: boolean;
    rotationDays: number | null;
  };
  clientConfiguration: {
    configured: boolean;
    envKey: string;
  };
}

interface OAuthCallbackInput {
  providerKey: string;
  code: string;
  state: string;
}

interface OAuthCallbackResult {
  connection: {
    id: string;
    providerKey: string;
    status: "connected";
    authMode: "oauth2";
    exchangedAt: string;
    expiresAt: string;
    refreshTokenRotationDueAt: string | null;
  };
  trace: {
    requestId: string;
    sourceRequestId: string;
  };
  tokenExchange: {
    status: string;
    reason: string;
  };
}

interface ApiKeyCredentialInput {
  providerKey: string;
  apiKey: string;
  label?: string;
  brandId?: string;
}

interface ApiKeyCredentialResult {
  connection: {
    id: string;
    providerKey: string;
    status: "connected";
    authMode: "api_key";
    label: string;
    keyPreview: string;
    rotationDueAt: string | null;
  };
  credentialStorage: {
    status: string;
    recommendation: string;
  };
}

interface ServiceAccountCredentialInput {
  providerKey: string;
  clientEmail: string;
  privateKeyId: string;
  projectId?: string;
  brandId?: string;
}

interface ServiceAccountCredentialResult {
  connection: {
    id: string;
    providerKey: string;
    status: "connected";
    authMode: "service_account";
    clientEmail: string;
    projectId: string | null;
    privateKeyIdPreview: string;
    rotationDueAt: string | null;
  };
  credentialStorage: {
    status: string;
    recommendation: string;
  };
}

async function postApi<TData>(path: string, payload: unknown): Promise<TData> {
  const { data } = await fetchApi<TData>(path, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  return data;
}

export function useStartOAuthIntegration() {
  return useMutation({
    mutationFn: (payload: OAuthStartInput) =>
      postApi<OAuthStartResult>("/api/v1/integrations/oauth/start", payload),
    onError: () => {
      toast.error("Failed to initialize OAuth flow.");
    }
  });
}

export function useCompleteOAuthIntegration() {
  return useMutation({
    mutationFn: (payload: OAuthCallbackInput) =>
      postApi<OAuthCallbackResult>("/api/v1/integrations/oauth/callback", payload),
    onError: () => {
      toast.error("Failed to finalize OAuth connection.");
    }
  });
}

export function useConnectWithApiKey() {
  return useMutation({
    mutationFn: (payload: ApiKeyCredentialInput) =>
      postApi<ApiKeyCredentialResult>("/api/v1/integrations/credentials/api-key", payload),
    onError: () => {
      toast.error("Failed to save API key credentials.");
    }
  });
}

export function useConnectWithServiceAccount() {
  return useMutation({
    mutationFn: (payload: ServiceAccountCredentialInput) =>
      postApi<ServiceAccountCredentialResult>(
        "/api/v1/integrations/credentials/service-account",
        payload
      ),
    onError: () => {
      toast.error("Failed to save service account credentials.");
    }
  });
}

export type {
  ApiKeyCredentialInput,
  ApiKeyCredentialResult,
  OAuthCallbackInput,
  OAuthCallbackResult,
  OAuthStartInput,
  OAuthStartResult,
  ServiceAccountCredentialInput,
  ServiceAccountCredentialResult
};
