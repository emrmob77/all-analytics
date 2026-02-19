import type { ApiErrorPayload } from "@/lib/api/types";

const INTERNAL_ERROR_MESSAGE = "Unexpected server error.";

interface ApiErrorOptions {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  expose?: boolean;
}

class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.expose = options.expose ?? false;
  }
}

function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof SyntaxError) {
    return new ApiError({
      status: 400,
      code: "INVALID_JSON",
      message: "Request body must be valid JSON.",
      expose: true
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      status: 500,
      code: "INTERNAL_ERROR",
      message: INTERNAL_ERROR_MESSAGE,
      details: error.message,
      expose: false
    });
  }

  return new ApiError({
    status: 500,
    code: "INTERNAL_ERROR",
    message: INTERNAL_ERROR_MESSAGE,
    expose: false
  });
}

function toApiErrorPayload(error: ApiError): ApiErrorPayload {
  const payload: ApiErrorPayload = {
    code: error.code,
    message: error.expose ? error.message : INTERNAL_ERROR_MESSAGE
  };

  if (error.expose && typeof error.details !== "undefined") {
    payload.details = error.details;
  }

  return payload;
}

export { ApiError, normalizeApiError, toApiErrorPayload };
