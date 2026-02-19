import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyBoolean, readBodyString } from "@/lib/api/validation";
import { getDefaultTenantId, upsertOnboardingState } from "@/lib/saas/store";

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const connectedPlatforms = Array.isArray(body.connectedPlatforms)
    ? body.connectedPlatforms.filter((item): item is string => typeof item === "string")
    : undefined;

  const selectedKpis = Array.isArray(body.selectedKpis)
    ? body.selectedKpis.filter((item): item is string => typeof item === "string")
    : undefined;

  const onboarding = upsertOnboardingState({
    tenantId: readBodyString(body, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId(),
    currentStep: (readBodyString(body, "currentStep", { maxLength: 20 }) as
      | "workspace"
      | "integration"
      | "kpi"
      | "done"
      | undefined) ?? undefined,
    connectedPlatforms,
    selectedKpis,
    completed: readBodyBoolean(body, "completed")
  });

  return {
    data: {
      onboarding
    }
  };
}, {
  audit: {
    action: "onboarding.complete"
  }
});
