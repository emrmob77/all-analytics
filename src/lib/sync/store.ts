import type {
  SyncDeadLetterEvent,
  SyncFrequency,
  SyncJob,
  SyncJobStatus
} from "@/lib/sync/types";

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function nextRunFromFrequency(frequency: SyncFrequency, from = new Date()): string {
  const next = new Date(from);

  if (frequency === "hourly") {
    next.setUTCHours(next.getUTCHours() + 1);
  } else {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next.toISOString();
}

const syncJobStore = new Map<string, SyncJob>();
const syncDeadLetterStore: SyncDeadLetterEvent[] = [];

interface CreateSyncJobInput {
  providerKey: string;
  brandId: string;
  frequency: SyncFrequency;
  cursor?: string | null;
  status?: SyncJobStatus;
  maxRetries?: number;
  baseBackoffMs?: number;
}

function createSyncJob(input: CreateSyncJobInput): SyncJob {
  const createdAt = new Date().toISOString();
  const job: SyncJob = {
    id: newId("sync_job"),
    providerKey: input.providerKey,
    brandId: input.brandId,
    frequency: input.frequency,
    status: input.status ?? "active",
    cursor: input.cursor ?? null,
    retryCount: 0,
    maxRetries: input.maxRetries ?? 3,
    baseBackoffMs: input.baseBackoffMs ?? 1000,
    lastRunAt: null,
    nextRunAt: nextRunFromFrequency(input.frequency),
    lastError: null,
    createdAt,
    updatedAt: createdAt
  };

  syncJobStore.set(job.id, job);
  return job;
}

function listSyncJobs(filters?: {
  providerKey?: string;
  brandId?: string;
  status?: SyncJobStatus;
  limit?: number;
}): SyncJob[] {
  const limit = filters?.limit ?? 100;

  return [...syncJobStore.values()]
    .filter((job) => {
      if (filters?.providerKey && job.providerKey !== filters.providerKey) {
        return false;
      }

      if (filters?.brandId && job.brandId !== filters.brandId) {
        return false;
      }

      if (filters?.status && job.status !== filters.status) {
        return false;
      }

      return true;
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, Math.max(0, limit));
}

function getSyncJob(jobId: string): SyncJob | undefined {
  return syncJobStore.get(jobId);
}

function updateSyncJob(jobId: string, update: Partial<SyncJob>): SyncJob | undefined {
  const current = syncJobStore.get(jobId);
  if (!current) {
    return undefined;
  }

  const next: SyncJob = {
    ...current,
    ...update,
    updatedAt: new Date().toISOString()
  };

  syncJobStore.set(jobId, next);
  return next;
}

function addDeadLetter(input: Omit<SyncDeadLetterEvent, "id">): SyncDeadLetterEvent {
  const event: SyncDeadLetterEvent = {
    id: newId("dead_letter"),
    ...input
  };

  syncDeadLetterStore.unshift(event);
  return event;
}

function listDeadLetters(filters?: { jobId?: string; providerKey?: string; limit?: number }): SyncDeadLetterEvent[] {
  const limit = filters?.limit ?? 100;

  return syncDeadLetterStore
    .filter((event) => {
      if (filters?.jobId && event.jobId !== filters.jobId) {
        return false;
      }

      if (filters?.providerKey && event.providerKey !== filters.providerKey) {
        return false;
      }

      return true;
    })
    .slice(0, Math.max(0, limit));
}

function resetSyncStore(): void {
  syncJobStore.clear();
  syncDeadLetterStore.splice(0, syncDeadLetterStore.length);
}

export {
  addDeadLetter,
  createSyncJob,
  getSyncJob,
  listDeadLetters,
  listSyncJobs,
  nextRunFromFrequency,
  resetSyncStore,
  updateSyncJob
};
export type { CreateSyncJobInput };
