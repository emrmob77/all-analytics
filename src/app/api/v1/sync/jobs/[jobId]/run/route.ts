import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyBoolean } from "@/lib/api/validation";
import { runSyncJob } from "@/lib/sync/engine";
import { getSyncJob } from "@/lib/sync/store";

function extractJobIdFromPath(url: URL): string {
  const match = url.pathname.match(/\/api\/v1\/sync\/jobs\/([^/]+)\/run$/);

  if (!match?.[1]) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Could not resolve job id from path.",
      expose: true
    });
  }

  return decodeURIComponent(match[1]);
}

function parseRunSyncJobBody(body: unknown): { simulateRateLimit?: boolean } {
  if (typeof body === "undefined" || body === null) {
    return {};
  }

  const record = ensureObjectRecord(body);

  return {
    simulateRateLimit: readBodyBoolean(record, "simulateRateLimit")
  };
}

export const POST = createApiHandler(async (request, context) => {
  const jobId = extractJobIdFromPath(context.url);
  const contentLength = request.headers.get("content-length");
  const rawBody =
    contentLength && contentLength !== "0" ? await context.readJson<unknown>() : undefined;
  const payload = parseRunSyncJobBody(rawBody);
  const existingJob = getSyncJob(jobId);

  if (!existingJob) {
    throw new ApiError({
      status: 404,
      code: "SYNC_JOB_NOT_FOUND",
      message: `Sync job '${jobId}' not found.`,
      expose: true
    });
  }

  context.requireTenantAccess(existingJob.brandId);

  try {
    const run = runSyncJob({
      jobId,
      simulateRateLimit: payload.simulateRateLimit
    });

    return {
      data: run
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      throw new ApiError({
        status: 404,
        code: "SYNC_JOB_NOT_FOUND",
        message: error.message,
        expose: true
      });
    }

    if (error instanceof Error && error.message.includes("not active")) {
      throw new ApiError({
        status: 409,
        code: "SYNC_JOB_INACTIVE",
        message: error.message,
        expose: true
      });
    }

    throw error;
  }
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 30,
    windowMs: 60_000,
    keyPrefix: "sync-job-run"
  },
  audit: {
    action: "sync.jobs.run"
  }
});
