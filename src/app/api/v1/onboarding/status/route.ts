import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { readStringParam } from "@/lib/api/validation";
import { getDefaultTenantId, getOnboardingState } from "@/lib/saas/store";

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);
  const tenantId = readStringParam(url.searchParams, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId();

  const onboarding = getOnboardingState(tenantId);

  if (!onboarding) {
    throw new ApiError({
      status: 404,
      code: "ONBOARDING_NOT_FOUND",
      message: "Onboarding state not found.",
      expose: true
    });
  }

  return {
    data: {
      onboarding
    }
  };
});
