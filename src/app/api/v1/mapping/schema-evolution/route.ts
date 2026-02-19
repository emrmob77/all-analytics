import { createApiHandler } from "@/lib/api/handler";
import { readStringParam } from "@/lib/api/validation";
import {
  getCurrentSchemaVersion,
  getSchemaVersions,
  planSchemaMigration
} from "@/lib/mapping/normalization";

interface SchemaEvolutionQueryDto {
  fromVersion?: string;
  toVersion?: string;
}

function parseSchemaEvolutionQuery(url: URL): SchemaEvolutionQueryDto {
  const params = url.searchParams;

  return {
    fromVersion: readStringParam(params, "fromVersion", { maxLength: 16 }),
    toVersion: readStringParam(params, "toVersion", { maxLength: 16 })
  };
}

export const GET = createApiHandler(async (request) => {
  const query = parseSchemaEvolutionQuery(new URL(request.url));
  const currentVersion = getCurrentSchemaVersion();
  const migrationPlan = query.fromVersion
    ? planSchemaMigration(query.fromVersion, query.toVersion ?? currentVersion)
    : [];

  return {
    data: {
      currentVersion,
      versions: getSchemaVersions(),
      fromVersion: query.fromVersion ?? currentVersion,
      toVersion: query.toVersion ?? currentVersion,
      migrationPlan,
      strategy: {
        additiveChanges: "Apply online with backward-compatible readers.",
        transformChanges: "Run backfill jobs with canary validation on sampled tenants.",
        breakingChanges: "Use dual-write + read-switch rollout before dropping legacy columns."
      }
    }
  };
}, {
  auth: {
    required: true,
    roles: ["owner", "admin"]
  },
  rateLimit: {
    limit: 60,
    windowMs: 60_000,
    keyPrefix: "mapping-schema-evolution"
  },
  audit: {
    action: "mapping.schema_evolution"
  }
});
