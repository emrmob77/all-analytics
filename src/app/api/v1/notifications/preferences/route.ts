import { createApiHandler } from "@/lib/api/handler";
import {
  ensureObjectRecord,
  readBodyBoolean,
  readBodyInteger,
  readBodyString,
  readStringParam
} from "@/lib/api/validation";
import {
  getNotificationPreferences,
  updateNotificationPreferences
} from "@/lib/notifications/preferencesStore";

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);
  const tenantId = readStringParam(url.searchParams, "tenantId", { maxLength: 120 }) ?? "brand-1";
  const userId = readStringParam(url.searchParams, "userId", { maxLength: 120 }) ?? "user_demo_1";

  return {
    data: {
      preferences: getNotificationPreferences(tenantId, userId)
    }
  };
}, {
  rateLimit: {
    limit: 120,
    windowMs: 60_000,
    keyPrefix: "notifications-preferences-get"
  }
});

export const PUT = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const tenantId = readBodyString(body, "tenantId", { maxLength: 120 }) ?? "brand-1";
  const userId = readBodyString(body, "userId", { maxLength: 120 }) ?? "user_demo_1";

  const nextPreferences = updateNotificationPreferences(tenantId, userId, {
    channels: {
      inApp: readBodyBoolean(body, "inApp") ?? getNotificationPreferences(tenantId, userId).channels.inApp,
      email: readBodyBoolean(body, "email") ?? getNotificationPreferences(tenantId, userId).channels.email
    },
    thresholds: {
      spendSpikePercent:
        readBodyInteger(body, "spendSpikePercent", { min: 1, max: 500 }) ??
        getNotificationPreferences(tenantId, userId).thresholds.spendSpikePercent,
      roasDropPercent:
        readBodyInteger(body, "roasDropPercent", { min: 1, max: 500 }) ??
        getNotificationPreferences(tenantId, userId).thresholds.roasDropPercent,
      syncFailureCount:
        readBodyInteger(body, "syncFailureCount", { min: 1, max: 50 }) ??
        getNotificationPreferences(tenantId, userId).thresholds.syncFailureCount
    },
    quietHours: {
      start: readBodyString(body, "quietHoursStart", { maxLength: 5 }) ?? getNotificationPreferences(tenantId, userId).quietHours.start,
      end: readBodyString(body, "quietHoursEnd", { maxLength: 5 }) ?? getNotificationPreferences(tenantId, userId).quietHours.end
    },
    timezone: readBodyString(body, "timezone", { maxLength: 120 }) ?? getNotificationPreferences(tenantId, userId).timezone
  });

  return {
    data: {
      preferences: nextPreferences
    }
  };
}, {
  rateLimit: {
    limit: 60,
    windowMs: 60_000,
    keyPrefix: "notifications-preferences-put"
  },
  audit: {
    action: "notifications.preferences.update"
  }
});
