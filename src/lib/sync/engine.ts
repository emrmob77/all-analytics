import { addDeadLetter, getSyncJob, nextRunFromFrequency, updateSyncJob } from "@/lib/sync/store";
import type { SyncRunResult } from "@/lib/sync/types";

interface RunSyncJobInput {
  jobId: string;
  simulateRateLimit?: boolean;
}

function buildRunId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `sync_run_${crypto.randomUUID()}`;
  }

  return `sync_run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function jitterBackoff(baseBackoffMs: number, attempt: number): number {
  const exponential = baseBackoffMs * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * Math.floor(baseBackoffMs / 2));
  return exponential + jitter;
}

function isRateLimited(input: {
  simulateRateLimit?: boolean;
  providerKey: string;
  attempt: number;
}): boolean {
  if (input.simulateRateLimit) {
    return true;
  }

  const hashSeed = `${input.providerKey}:${input.attempt}`;
  const hash = [...hashSeed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hash % 11 === 0;
}

function buildCursor(previousCursor: string | null): string {
  const nextChunk = Date.now().toString(36);
  return previousCursor ? `${previousCursor}-${nextChunk}` : `cursor-${nextChunk}`;
}

function runSyncJob(input: RunSyncJobInput): SyncRunResult {
  const job = getSyncJob(input.jobId);
  const startedAtDate = new Date();

  if (!job) {
    throw new Error(`Sync job '${input.jobId}' not found.`);
  }

  if (job.status !== "active") {
    throw new Error(`Sync job '${input.jobId}' is not active.`);
  }

  const attempt = job.retryCount + 1;
  const rateLimited = isRateLimited({
    simulateRateLimit: input.simulateRateLimit,
    providerKey: job.providerKey,
    attempt
  });

  if (rateLimited) {
    const errorMessage = "429 rate limited by upstream provider.";

    if (attempt > job.maxRetries) {
      addDeadLetter({
        jobId: job.id,
        providerKey: job.providerKey,
        failedAt: new Date().toISOString(),
        reason: errorMessage,
        retryCount: attempt
      });

      updateSyncJob(job.id, {
        retryCount: 0,
        lastError: errorMessage,
        nextRunAt: nextRunFromFrequency(job.frequency)
      });

      const finishedAt = new Date().toISOString();
      return {
        jobId: job.id,
        runId: buildRunId(),
        status: "dead_letter",
        attempt,
        rateLimited: true,
        startedAt: startedAtDate.toISOString(),
        finishedAt,
        durationMs: Math.max(0, new Date(finishedAt).getTime() - startedAtDate.getTime()),
        processedRecords: 0,
        cursor: job.cursor,
        nextRetryAt: null,
        nextScheduledRunAt: nextRunFromFrequency(job.frequency)
      };
    }

    const backoffMs = jitterBackoff(job.baseBackoffMs, attempt);
    const nextRetryAtDate = new Date(Date.now() + backoffMs);

    updateSyncJob(job.id, {
      retryCount: attempt,
      lastError: errorMessage,
      nextRunAt: nextRetryAtDate.toISOString()
    });

    const finishedAt = new Date().toISOString();
    return {
      jobId: job.id,
      runId: buildRunId(),
      status: "retry_scheduled",
      attempt,
      rateLimited: true,
      startedAt: startedAtDate.toISOString(),
      finishedAt,
      durationMs: Math.max(0, new Date(finishedAt).getTime() - startedAtDate.getTime()),
      processedRecords: 0,
      cursor: job.cursor,
      nextRetryAt: nextRetryAtDate.toISOString(),
      nextScheduledRunAt: null
    };
  }

  const processedRecords = 100 + Math.floor(Math.random() * 900);
  const cursor = buildCursor(job.cursor);
  const finishedAt = new Date().toISOString();

  updateSyncJob(job.id, {
    retryCount: 0,
    cursor,
    lastRunAt: finishedAt,
    lastError: null,
    nextRunAt: nextRunFromFrequency(job.frequency)
  });

  return {
    jobId: job.id,
    runId: buildRunId(),
    status: "success",
    attempt,
    rateLimited: false,
    startedAt: startedAtDate.toISOString(),
    finishedAt,
    durationMs: Math.max(0, new Date(finishedAt).getTime() - startedAtDate.getTime()),
    processedRecords,
    cursor,
    nextRetryAt: null,
    nextScheduledRunAt: nextRunFromFrequency(job.frequency, new Date(finishedAt))
  };
}

export { runSyncJob };
export type { RunSyncJobInput };
