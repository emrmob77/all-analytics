import { beforeEach, describe, expect, it } from "vitest";

import { runSyncJob } from "@/lib/sync/engine";
import { createSyncJob, getSyncJob, listDeadLetters, resetSyncStore } from "@/lib/sync/store";

describe("sync engine", () => {
  beforeEach(() => {
    resetSyncStore();
  });

  it("runs a sync job and updates incremental cursor", () => {
    const job = createSyncJob({
      providerKey: "google-ads",
      brandId: "brand-1",
      frequency: "hourly"
    });

    const result = runSyncJob({ jobId: job.id, simulateRateLimit: false });
    const updatedJob = getSyncJob(job.id);

    expect(result.status).toBe("success");
    expect(result.cursor).toBeTruthy();
    expect(updatedJob?.cursor).toBe(result.cursor);
    expect(updatedJob?.retryCount).toBe(0);
  });

  it("moves job to dead-letter after retry limit is exceeded", () => {
    const job = createSyncJob({
      providerKey: "meta-ads",
      brandId: "brand-2",
      frequency: "hourly",
      maxRetries: 1
    });

    const firstRun = runSyncJob({ jobId: job.id, simulateRateLimit: true });
    const secondRun = runSyncJob({ jobId: job.id, simulateRateLimit: true });
    const deadLetters = listDeadLetters({ jobId: job.id });

    expect(firstRun.status).toBe("retry_scheduled");
    expect(secondRun.status).toBe("dead_letter");
    expect(deadLetters).toHaveLength(1);
  });
});
