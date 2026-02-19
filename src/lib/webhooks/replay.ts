const replayProtectionStore = new Map<string, number>();

function nowMs(): number {
  return Date.now();
}

function purgeExpiredReplayKeys(currentTs = nowMs()): void {
  for (const [key, expiryMs] of replayProtectionStore.entries()) {
    if (expiryMs <= currentTs) {
      replayProtectionStore.delete(key);
    }
  }
}

function registerWebhookReplayKey(
  replayKey: string,
  windowMs = 5 * 60 * 1000
): { duplicate: boolean; expiresAtMs: number } {
  const currentTs = nowMs();
  purgeExpiredReplayKeys(currentTs);

  const existingExpiry = replayProtectionStore.get(replayKey);

  if (existingExpiry && existingExpiry > currentTs) {
    return {
      duplicate: true,
      expiresAtMs: existingExpiry
    };
  }

  const expiresAtMs = currentTs + windowMs;
  replayProtectionStore.set(replayKey, expiresAtMs);

  return {
    duplicate: false,
    expiresAtMs
  };
}

function clearReplayProtectionStore(): void {
  replayProtectionStore.clear();
}

export { clearReplayProtectionStore, registerWebhookReplayKey };
