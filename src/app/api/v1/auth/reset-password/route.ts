import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString } from "@/lib/api/validation";
import { resetPassword } from "@/lib/auth/mockAuthStore";

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const token = readBodyString(body, "token", { required: true, maxLength: 255 }) ?? "";
  const nextPassword = readBodyString(body, "password", { required: true, minLength: 8, maxLength: 200 }) ?? "";

  const result = resetPassword({ token, nextPassword });

  if ("error" in result) {
    throw new ApiError({
      status: 400,
      code: "RESET_TOKEN_INVALID",
      message: "Reset token is invalid or expired.",
      expose: true
    });
  }

  return {
    data: {
      user: result.user
    }
  };
}, {
  rateLimit: {
    limit: 10,
    windowMs: 60_000,
    keyPrefix: "auth-reset-password"
  },
  audit: {
    action: "auth.reset_password"
  }
});
