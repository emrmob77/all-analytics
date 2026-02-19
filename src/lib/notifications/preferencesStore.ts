export interface NotificationPreferences {
  tenantId: string;
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
  };
  thresholds: {
    spendSpikePercent: number;
    roasDropPercent: number;
    syncFailureCount: number;
  };
  quietHours: {
    start: string;
    end: string;
  };
  timezone: string;
  updatedAt: string;
}

function nowIso() {
  return new Date().toISOString();
}

const preferenceStore = new Map<string, NotificationPreferences>();

const defaultRecord: NotificationPreferences = {
  tenantId: "brand-1",
  userId: "user_demo_1",
  channels: {
    inApp: true,
    email: true
  },
  thresholds: {
    spendSpikePercent: 25,
    roasDropPercent: 15,
    syncFailureCount: 3
  },
  quietHours: {
    start: "23:00",
    end: "07:00"
  },
  timezone: "Europe/Istanbul",
  updatedAt: nowIso()
};

preferenceStore.set(`${defaultRecord.tenantId}:${defaultRecord.userId}`, defaultRecord);

function buildKey(tenantId: string, userId: string) {
  return `${tenantId}:${userId}`;
}

function getNotificationPreferences(tenantId = "brand-1", userId = "user_demo_1") {
  const existing = preferenceStore.get(buildKey(tenantId, userId));

  if (existing) {
    return existing;
  }

  const fallback: NotificationPreferences = {
    ...defaultRecord,
    tenantId,
    userId,
    updatedAt: nowIso()
  };

  preferenceStore.set(buildKey(tenantId, userId), fallback);
  return fallback;
}

function updateNotificationPreferences(
  tenantId: string,
  userId: string,
  updates: Partial<Omit<NotificationPreferences, "tenantId" | "userId" | "updatedAt">>
) {
  const current = getNotificationPreferences(tenantId, userId);

  const next: NotificationPreferences = {
    ...current,
    channels: {
      ...current.channels,
      ...updates.channels
    },
    thresholds: {
      ...current.thresholds,
      ...updates.thresholds
    },
    quietHours: {
      ...current.quietHours,
      ...updates.quietHours
    },
    timezone: updates.timezone ?? current.timezone,
    updatedAt: nowIso()
  };

  preferenceStore.set(buildKey(tenantId, userId), next);
  return next;
}

export { getNotificationPreferences, updateNotificationPreferences };
