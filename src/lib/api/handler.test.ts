import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { REQUEST_ID_HEADER, createApiHandler } from "@/lib/api/handler";

describe("createApiHandler", () => {
  it("returns a success envelope and propagates request id", async () => {
    const requestId = "req-test-123";
    const handler = createApiHandler(async () => ({
      data: {
        value: "ok"
      }
    }));

    const response = await handler(
      new Request("http://localhost/api/v1/example", {
        headers: {
          [REQUEST_ID_HEADER]: requestId
        }
      })
    );

    const body = (await response.json()) as {
      ok: boolean;
      requestId: string;
      data: { value: string };
      meta: { durationMs: number };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe(requestId);
    expect(body.ok).toBe(true);
    expect(body.requestId).toBe(requestId);
    expect(body.data).toEqual({ value: "ok" });
    expect(body.meta.durationMs).toBeTypeOf("number");
  });

  it("returns an error envelope for ApiError", async () => {
    const handler = createApiHandler(async () => {
      throw new ApiError({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Authentication required.",
        expose: true
      });
    });

    const response = await handler(new Request("http://localhost/api/v1/example"));
    const body = (await response.json()) as {
      ok: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toBe("Authentication required.");
  });
});
