import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString } from "@/lib/api/validation";
import { registerUser } from "@/lib/auth/mockAuthStore";

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const email = readBodyString(body, "email", { required: true, maxLength: 255 }) ?? "";
  const password = readBodyString(body, "password", { required: true, minLength: 8, maxLength: 200 }) ?? "";
  const fullName = readBodyString(body, "fullName", { required: true, minLength: 2, maxLength: 120 }) ?? "";

  const result = registerUser({
    email,
    password,
    fullName
  });

  if ("error" in result) {
    throw new ApiError({
      status: 409,
      code: "EMAIL_IN_USE",
      message: "A user with this email already exists.",
      expose: true
    });
  }

  return {
    data: {
      user: result.user
    },
    status: 201
  };
}, {
  rateLimit: {
    limit: 15,
    windowMs: 60_000,
    keyPrefix: "auth-register"
  },
  audit: {
    action: "auth.register"
  }
});
