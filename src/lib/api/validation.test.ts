import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  ensureObjectRecord,
  readBodyBoolean,
  readBodyEnum,
  readBodyInteger,
  readBodyString,
  readEnumParam,
  readIntegerParam,
  readStringParam
} from "@/lib/api/validation";

function params(query: string) {
  return new URL(`http://localhost/test${query}`).searchParams;
}

describe("api validation helpers", () => {
  it("parses valid query params", () => {
    const searchParams = params("?search=google&limit=25&status=active");

    const search = readStringParam(searchParams, "search", { maxLength: 64 });
    const limit = readIntegerParam(searchParams, "limit", { min: 1, max: 100 });
    const status = readEnumParam(searchParams, "status", ["active", "paused"] as const);

    expect(search).toBe("google");
    expect(limit).toBe(25);
    expect(status).toBe("active");
  });

  it("throws ApiError for invalid integer", () => {
    const searchParams = params("?limit=12.4");

    expect(() => readIntegerParam(searchParams, "limit", { min: 1, max: 100 })).toThrowError(ApiError);
  });

  it("throws ApiError for invalid enum value", () => {
    const searchParams = params("?status=draft");

    expect(() => readEnumParam(searchParams, "status", ["active", "paused"] as const)).toThrowError(ApiError);
  });

  it("parses body fields and validates enums", () => {
    const record = ensureObjectRecord({
      providerKey: "google-ads",
      authMode: "oauth2"
    });

    const providerKey = readBodyString(record, "providerKey", { required: true });
    const authMode = readBodyEnum(record, "authMode", ["oauth2", "api_key"] as const, {
      required: true
    });

    expect(providerKey).toBe("google-ads");
    expect(authMode).toBe("oauth2");
  });

  it("parses boolean and integer values from body", () => {
    const record = ensureObjectRecord({
      maxRetries: "3",
      simulateRateLimit: "true"
    });

    const maxRetries = readBodyInteger(record, "maxRetries", { min: 0, max: 10 });
    const simulateRateLimit = readBodyBoolean(record, "simulateRateLimit");

    expect(maxRetries).toBe(3);
    expect(simulateRateLimit).toBe(true);
  });
});
