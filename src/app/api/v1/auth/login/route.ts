import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString } from "@/lib/api/validation";
import { buildSessionCookieHeaders } from "@/lib/auth/cookies";
import { loginUser } from "@/lib/auth/mockAuthStore";

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());
  const email = readBodyString(body, "email", { required: true, maxLength: 255 }) ?? "";
  const password = readBodyString(body, "password", { required: true, minLength: 8, maxLength: 200 }) ?? "";

  const result = loginUser({ email, password });

  if ("error" in result) {
    throw new ApiError({
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
      expose: true
    });
  }

  return {
    data: {
      user: result.user,
      session: {
        expiresAt: result.session.expiresAt,
        refreshExpiresAt: result.session.refreshExpiresAt
      }
    },
    headers: buildSessionCookieHeaders(result.session)
  };
}, {
  rateLimit: {
    limit: 20,
    windowMs: 60_000,
    keyPrefix: "auth-login"
  },
  audit: {
    action: "auth.login"
  }
});
