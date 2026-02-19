import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString, readStringParam } from "@/lib/api/validation";
import { getDefaultUserId, getUserProfile, updateUserProfile } from "@/lib/saas/store";

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);
  const userId = readStringParam(url.searchParams, "userId", { maxLength: 120 }) ?? getDefaultUserId();

  const profile = getUserProfile(userId);

  if (!profile) {
    throw new ApiError({
      status: 404,
      code: "PROFILE_NOT_FOUND",
      message: "User profile not found.",
      expose: true
    });
  }

  return {
    data: {
      profile
    }
  };
});

export const PUT = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const userId = readBodyString(body, "userId", { maxLength: 120 }) ?? getDefaultUserId();

  const profile = updateUserProfile(userId, {
    firstName: readBodyString(body, "firstName", { maxLength: 120 }),
    lastName: readBodyString(body, "lastName", { maxLength: 120 }),
    email: readBodyString(body, "email", { maxLength: 255 }),
    avatarUrl: readBodyString(body, "avatarUrl", { maxLength: 800 }),
    language: readBodyString(body, "language", { maxLength: 50 }),
    timezone: readBodyString(body, "timezone", { maxLength: 120 }),
    locale: readBodyString(body, "locale", { maxLength: 50 })
  });

  if (!profile) {
    throw new ApiError({
      status: 404,
      code: "PROFILE_NOT_FOUND",
      message: "User profile not found.",
      expose: true
    });
  }

  return {
    data: {
      profile
    }
  };
}, {
  audit: {
    action: "settings.profile.update"
  }
});
