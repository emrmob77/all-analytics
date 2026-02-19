import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString } from "@/lib/api/validation";
import { createPasswordResetToken } from "@/lib/auth/mockAuthStore";

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const email = readBodyString(body, "email", { required: true, maxLength: 255 }) ?? "";
  const resetToken = createPasswordResetToken(email);

  return {
    data: {
      sent: true,
      // Demo mode only: token is returned in response instead of email provider.
      resetToken
    }
  };
}, {
  rateLimit: {
    limit: 10,
    windowMs: 60_000,
    keyPrefix: "auth-forgot-password"
  },
  audit: {
    action: "auth.forgot_password"
  }
});
