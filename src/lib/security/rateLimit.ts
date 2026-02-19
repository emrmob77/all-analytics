interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSec: number;
}

interface RateLimitState {
  count: number;
  resetAtMs: number;
}

const rateLimitStore = new Map<string, RateLimitState>();
const MAX_STORE_SIZE = 10_000;

function nowMs(): number {
  return Date.now();
}

function cleanupExpiredEntries(currentTs = nowMs()) {
  if (rateLimitStore.size <= MAX_STORE_SIZE) {
    return;
  }

  for (const [key, state] of rateLimitStore.entries()) {
    if (state.resetAtMs <= currentTs) {
      rateLimitStore.delete(key);
    }
  }
}

function consumeRateLimit(rateLimitKey: string, config: RateLimitConfig): RateLimitResult {
  const currentTs = nowMs();
  cleanupExpiredEntries(currentTs);

  const currentState = rateLimitStore.get(rateLimitKey);

  if (!currentState || currentState.resetAtMs <= currentTs) {
    const resetAtMs = currentTs + config.windowMs;
    rateLimitStore.set(rateLimitKey, { count: 1, resetAtMs });

    return {
      allowed: true,
      limit: config.limit,
      remaining: Math.max(0, config.limit - 1),
      resetAtMs,
      retryAfterSec: Math.max(1, Math.ceil((resetAtMs - currentTs) / 1000))
    };
  }

  if (currentState.count >= config.limit) {
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetAtMs: currentState.resetAtMs,
      retryAfterSec: Math.max(1, Math.ceil((currentState.resetAtMs - currentTs) / 1000))
    };
  }

  currentState.count += 1;
  rateLimitStore.set(rateLimitKey, currentState);

  return {
    allowed: true,
    limit: config.limit,
    remaining: Math.max(0, config.limit - currentState.count),
    resetAtMs: currentState.resetAtMs,
    retryAfterSec: Math.max(1, Math.ceil((currentState.resetAtMs - currentTs) / 1000))
  };
}

function clearRateLimitStore() {
  rateLimitStore.clear();
}

export { clearRateLimitStore, consumeRateLimit };
export type { RateLimitConfig, RateLimitResult };
