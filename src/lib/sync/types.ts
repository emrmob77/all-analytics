const syncFrequencyValues = ["hourly", "daily"] as const;
type SyncFrequency = (typeof syncFrequencyValues)[number];

const syncJobStatusValues = ["active", "paused"] as const;
type SyncJobStatus = (typeof syncJobStatusValues)[number];

const syncRunStatusValues = ["success", "retry_scheduled", "dead_letter"] as const;
type SyncRunStatus = (typeof syncRunStatusValues)[number];

interface SyncJob {
  id: string;
  providerKey: string;
  brandId: string;
  frequency: SyncFrequency;
  status: SyncJobStatus;
  cursor: string | null;
  retryCount: number;
  maxRetries: number;
  baseBackoffMs: number;
  lastRunAt: string | null;
  nextRunAt: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SyncDeadLetterEvent {
  id: string;
  jobId: string;
  providerKey: string;
  failedAt: string;
  reason: string;
  retryCount: number;
}

interface SyncRunResult {
  jobId: string;
  runId: string;
  status: SyncRunStatus;
  attempt: number;
  rateLimited: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  processedRecords: number;
  cursor: string | null;
  nextRetryAt: string | null;
  nextScheduledRunAt: string | null;
}

export { syncFrequencyValues, syncJobStatusValues, syncRunStatusValues };
export type {
  SyncDeadLetterEvent,
  SyncFrequency,
  SyncJob,
  SyncJobStatus,
  SyncRunResult,
  SyncRunStatus
};
