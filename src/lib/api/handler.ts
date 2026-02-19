import { ApiError, normalizeApiError, toApiErrorPayload } from "@/lib/api/errors";
import { assertPrincipalRole, assertTenantIsolation, authenticateRequest } from "@/lib/security/auth";
import type { AuthenticatedPrincipal } from "@/lib/security/auth";
import { recordAuditEvent } from "@/lib/security/audit";
import { consumeRateLimit } from "@/lib/security/rateLimit";
import type { RateLimitConfig, RateLimitResult } from "@/lib/security/rateLimit";
import type { ApiEnvelope, ApiErrorEnvelope, ApiResponseMeta, ApiSuccessEnvelope } from "@/lib/api/types";

const REQUEST_ID_HEADER = "x-request-id";
const RESPONSE_TIME_HEADER = "x-response-time-ms";
const RATE_LIMIT_LIMIT_HEADER = "x-ratelimit-limit";
const RATE_LIMIT_REMAINING_HEADER = "x-ratelimit-remaining";
const RATE_LIMIT_RESET_HEADER = "x-ratelimit-reset";
const RATE_LIMIT_RETRY_AFTER_HEADER = "retry-after";

const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  limit: 120,
  windowMs: 60_000
};

interface ApiTrace {
  requestId: string;
  startedAtMs: number;
  method: string;
  path: string;
}

interface ApiAuthOptions {
  required?: boolean;
  roles?: string[];
}

interface ApiRateLimitOptions {
  limit?: number;
  windowMs?: number;
  keyPrefix?: string;
}

interface ApiAuditOptions {
  action: string;
  metadata?: Record<string, unknown>;
}

interface ApiHandlerOptions {
  auth?: ApiAuthOptions;
  rateLimit?: ApiRateLimitOptions;
  audit?: ApiAuditOptions;
}

interface ApiHandlerContext {
  requestId: string;
  trace: ApiTrace;
  url: URL;
  traceHeaders: Readonly<Record<string, string>>;
  principal?: AuthenticatedPrincipal;
  readJson<TBody = unknown>(): Promise<TBody>;
  requireTenantAccess(tenantId?: string): void;
}

interface ApiHandlerResult<TData> {
  data: TData;
  status?: number;
  headers?: HeadersInit;
}

type ApiHandler<TData> = (
  request: Request,
  context: ApiHandlerContext
) => Promise<ApiHandlerResult<TData>> | ApiHandlerResult<TData>;

function resolveClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (forwardedFor) {
    return forwardedFor;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

function resolveRateLimitConfig(options?: ApiRateLimitOptions): RateLimitConfig {
  return {
    limit: options?.limit ?? DEFAULT_RATE_LIMIT_CONFIG.limit,
    windowMs: options?.windowMs ?? DEFAULT_RATE_LIMIT_CONFIG.windowMs
  };
}

function buildRateLimitKey(args: {
  request: Request;
  trace: ApiTrace;
  principal?: AuthenticatedPrincipal;
  keyPrefix?: string;
}): string {
  const identity = args.principal
    ? `user:${args.principal.userId}:tenant:${args.principal.tenantId ?? "none"}`
    : `ip:${resolveClientIp(args.request)}`;

  const keyPrefix = args.keyPrefix ?? "api";
  return `${keyPrefix}:${args.request.method}:${args.trace.path}:${identity}`;
}

function toRateLimitHeaders(rateLimit: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set(RATE_LIMIT_LIMIT_HEADER, String(rateLimit.limit));
  headers.set(RATE_LIMIT_REMAINING_HEADER, String(rateLimit.remaining));
  headers.set(RATE_LIMIT_RESET_HEADER, String(Math.floor(rateLimit.resetAtMs / 1000)));
  headers.set(RATE_LIMIT_RETRY_AFTER_HEADER, String(rateLimit.retryAfterSec));
  return headers;
}

function mergeHeaders(...headers: Array<HeadersInit | undefined>): Headers {
  const mergedHeaders = new Headers();

  for (const headerSet of headers) {
    if (!headerSet) {
      continue;
    }

    const iterableHeaders = new Headers(headerSet);

    for (const [key, value] of iterableHeaders.entries()) {
      mergedHeaders.set(key, value);
    }
  }

  return mergedHeaders;
}

function generateRequestId(request: Request): string {
  const propagatedId = request.headers.get(REQUEST_ID_HEADER)?.trim();

  if (propagatedId) {
    return propagatedId;
  }

  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function createTrace(request: Request, url: URL): ApiTrace {
  return {
    requestId: generateRequestId(request),
    startedAtMs: Date.now(),
    method: request.method,
    path: url.pathname
  };
}

function buildMeta(trace: ApiTrace): ApiResponseMeta {
  return {
    durationMs: Math.max(0, Date.now() - trace.startedAtMs),
    timestamp: new Date().toISOString()
  };
}

function jsonResponse<TData>(
  envelope: ApiEnvelope<TData>,
  status: number,
  trace: ApiTrace,
  headers?: HeadersInit
): Response {
  const responseHeaders = mergeHeaders(headers);
  responseHeaders.set("content-type", "application/json; charset=utf-8");
  responseHeaders.set(REQUEST_ID_HEADER, trace.requestId);
  responseHeaders.set(RESPONSE_TIME_HEADER, String(envelope.meta.durationMs));

  return new Response(JSON.stringify(envelope), {
    status,
    headers: responseHeaders
  });
}

function successResponse<TData>(trace: ApiTrace, result: ApiHandlerResult<TData>): Response {
  const meta = buildMeta(trace);
  const envelope: ApiSuccessEnvelope<TData> = {
    ok: true,
    requestId: trace.requestId,
    data: result.data,
    meta
  };

  return jsonResponse(envelope, result.status ?? 200, trace, result.headers);
}

function errorResponse(trace: ApiTrace, error: unknown, headers?: HeadersInit): Response {
  const normalizedError = normalizeApiError(error);
  const meta = buildMeta(trace);
  const envelope: ApiErrorEnvelope = {
    ok: false,
    requestId: trace.requestId,
    error: toApiErrorPayload(normalizedError),
    meta
  };

  return jsonResponse(envelope, normalizedError.status, trace, headers);
}

function createApiHandler<TData>(handler: ApiHandler<TData>, options: ApiHandlerOptions = {}) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const trace = createTrace(request, url);
    const rateLimitConfig = resolveRateLimitConfig(options.rateLimit);
    let principal: AuthenticatedPrincipal | undefined;
    let rateLimitHeaders: Headers | undefined;

    try {
      if (options.auth?.required) {
        principal = await authenticateRequest(request);
        assertPrincipalRole(principal, options.auth.roles ?? []);
      }

      const rateLimitResult = consumeRateLimit(
        buildRateLimitKey({
          request,
          trace,
          principal,
          keyPrefix: options.rateLimit?.keyPrefix
        }),
        rateLimitConfig
      );

      rateLimitHeaders = toRateLimitHeaders(rateLimitResult);

      if (!rateLimitResult.allowed) {
        throw new ApiError({
          status: 429,
          code: "RATE_LIMIT_EXCEEDED",
          message: "Request limit exceeded. Please retry later.",
          details: {
            limit: rateLimitResult.limit,
            retryAfterSec: rateLimitResult.retryAfterSec
          },
          expose: true
        });
      }

      const context: ApiHandlerContext = {
        requestId: trace.requestId,
        trace,
        url,
        principal,
        traceHeaders: Object.freeze({
          [REQUEST_ID_HEADER]: trace.requestId
        }),
        readJson: async <TBody>() => request.json() as Promise<TBody>,
        requireTenantAccess: (tenantId?: string) => {
          if (!principal) {
            throw new ApiError({
              status: 401,
              code: "AUTH_TOKEN_REQUIRED",
              message: "Authenticated principal is required for tenant isolation checks.",
              expose: true
            });
          }

          assertTenantIsolation(principal, tenantId);
        }
      };

      const result = await handler(request, context);
      const successResponseResult = successResponse(trace, {
        ...result,
        headers: mergeHeaders(rateLimitHeaders, result.headers)
      });

      if (options.audit) {
        recordAuditEvent({
          level: "info",
          action: options.audit.action,
          route: trace.path,
          method: trace.method,
          status: successResponseResult.status,
          requestId: trace.requestId,
          userId: principal?.userId,
          tenantId: principal?.tenantId,
          metadata: options.audit.metadata
        });
      }

      return successResponseResult;
    } catch (error) {
      const normalizedError = normalizeApiError(error);

      if (options.audit) {
        recordAuditEvent({
          level: normalizedError.status >= 500 ? "error" : "warn",
          action: options.audit.action,
          route: trace.path,
          method: trace.method,
          status: normalizedError.status,
          requestId: trace.requestId,
          userId: principal?.userId,
          tenantId: principal?.tenantId,
          message: normalizedError.message,
          metadata: {
            ...options.audit.metadata,
            code: normalizedError.code
          }
        });
      }

      return errorResponse(trace, normalizedError, rateLimitHeaders);
    }
  };
}

export type { ApiHandlerContext, ApiHandlerOptions, ApiHandlerResult, ApiTrace };
export { REQUEST_ID_HEADER, createApiHandler };
