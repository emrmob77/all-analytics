import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import {
  ensureObjectRecord,
  readBodyInteger,
  readBodyString,
  readStringParam
} from "@/lib/api/validation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type UserMetricPreferenceRow = Database["public"]["Tables"]["user_metric_preferences"]["Row"];
type MetricRow = Database["public"]["Tables"]["metrics"]["Row"];

interface ListMetricPreferencesQueryDto {
  userId: string;
  brandId?: string;
}

interface CreateMetricPreferenceBodyDto {
  userId: string;
  brandId: string;
  metricId: string;
  position?: number;
}

interface DeleteMetricPreferenceBodyDto {
  preferenceId?: string;
  userId?: string;
  brandId?: string;
  metricId?: string;
}

function assertUserScope(context: {
  principal?: {
    userId: string;
    roles: string[];
  };
}, requestedUserId?: string): void {
  if (!requestedUserId || !context.principal) {
    return;
  }

  const isPrivileged = context.principal.roles.includes("owner") || context.principal.roles.includes("admin");

  if (!isPrivileged && context.principal.userId !== requestedUserId) {
    throw new ApiError({
      status: 403,
      code: "USER_SCOPE_DENIED",
      message: "Requested user scope does not match authenticated principal.",
      expose: true
    });
  }
}

function parseListMetricPreferencesQuery(url: URL): ListMetricPreferencesQueryDto {
  const params = url.searchParams;
  const userId = readStringParam(params, "userId", {
    required: true,
    maxLength: 128
  }) as string;

  return {
    userId,
    brandId: readStringParam(params, "brandId", { maxLength: 128 })
  };
}

function mapPreferences(preferences: UserMetricPreferenceRow[], metrics: MetricRow[]) {
  const metricById = new Map(metrics.map((metric) => [metric.id, metric]));

  return preferences.map((item) => {
    const metric = metricById.get(item.metric_id);

    return {
      id: item.id,
      userId: item.user_id,
      brandId: item.brand_id,
      metricId: item.metric_id,
      position: item.position,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      metric: metric
        ? {
            id: metric.id,
            name: metric.name,
            description: metric.description,
            category: metric.category,
            source: metric.source,
            isActive: metric.is_active
          }
        : null
    };
  });
}

async function resolveNextPosition(payload: CreateMetricPreferenceBodyDto): Promise<number> {
  if (typeof payload.position === "number") {
    return payload.position;
  }

  const { data, error } = await supabase
    .from("user_metric_preferences")
    .select("position")
    .eq("user_id", payload.userId)
    .eq("brand_id", payload.brandId)
    .order("position", { ascending: false })
    .limit(1);

  if (error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to resolve next metric preference position.",
      details: { source: "supabase", message: error.message },
      expose: true
    });
  }

  return (data?.[0]?.position ?? -1) + 1;
}

function parseCreateMetricPreferenceBody(body: unknown): CreateMetricPreferenceBodyDto {
  const record = ensureObjectRecord(body);

  return {
    userId: readBodyString(record, "userId", {
      required: true,
      maxLength: 128
    }) as string,
    brandId: readBodyString(record, "brandId", {
      required: true,
      maxLength: 128
    }) as string,
    metricId: readBodyString(record, "metricId", {
      required: true,
      maxLength: 128
    }) as string,
    position: readBodyInteger(record, "position", {
      min: 0,
      max: 10_000
    })
  };
}

function parseDeleteMetricPreferenceBody(body: unknown): DeleteMetricPreferenceBodyDto {
  const record = ensureObjectRecord(body);

  return {
    preferenceId: readBodyString(record, "preferenceId", { maxLength: 128 }),
    userId: readBodyString(record, "userId", { maxLength: 128 }),
    brandId: readBodyString(record, "brandId", { maxLength: 128 }),
    metricId: readBodyString(record, "metricId", { maxLength: 128 })
  };
}

export const GET = createApiHandler(async (request, context) => {
  const query = parseListMetricPreferencesQuery(new URL(request.url));
  context.requireTenantAccess(query.brandId);
  assertUserScope(context, query.userId);

  let preferenceQuery = supabase
    .from("user_metric_preferences")
    .select("id, user_id, brand_id, metric_id, position, created_at, updated_at")
    .eq("user_id", query.userId)
    .order("position", { ascending: true });

  if (query.brandId) {
    preferenceQuery = preferenceQuery.eq("brand_id", query.brandId);
  }

  const [preferencesResult, metricsResult] = await Promise.all([
    preferenceQuery,
    supabase.from("metrics").select("id, name, description, category, source, is_active, created_at, updated_at")
  ]);

  if (preferencesResult.error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to fetch user metric preferences.",
      details: { source: "supabase", message: preferencesResult.error.message },
      expose: true
    });
  }

  if (metricsResult.error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to fetch metrics dictionary.",
      details: { source: "supabase", message: metricsResult.error.message },
      expose: true
    });
  }

  return {
    data: {
      items: mapPreferences(preferencesResult.data ?? [], metricsResult.data ?? []),
      count: preferencesResult.data?.length ?? 0,
      filters: query
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 100,
    windowMs: 60_000,
    keyPrefix: "dashboard-metric-preferences-list"
  }
});

export const POST = createApiHandler(async (_request, context) => {
  const payload = parseCreateMetricPreferenceBody(await context.readJson<unknown>());
  context.requireTenantAccess(payload.brandId);
  assertUserScope(context, payload.userId);
  const position = await resolveNextPosition(payload);

  const { data, error } = await supabase
    .from("user_metric_preferences")
    .insert({
      user_id: payload.userId,
      brand_id: payload.brandId,
      metric_id: payload.metricId,
      position
    })
    .select("id, user_id, brand_id, metric_id, position, created_at, updated_at")
    .single();

  if (error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to create metric preference.",
      details: { source: "supabase", message: error.message },
      expose: true
    });
  }

  return {
    data: {
      item: {
        id: data.id,
        userId: data.user_id,
        brandId: data.brand_id,
        metricId: data.metric_id,
        position: data.position,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },
    status: 201
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 50,
    windowMs: 60_000,
    keyPrefix: "dashboard-metric-preferences-create"
  },
  audit: {
    action: "dashboard.metric_preferences.create"
  }
});

export const DELETE = createApiHandler(async (_request, context) => {
  const payload = parseDeleteMetricPreferenceBody(await context.readJson<unknown>());
  assertUserScope(context, payload.userId);
  let deleteQuery = supabase.from("user_metric_preferences").delete();

  if (payload.preferenceId) {
    if (payload.brandId) {
      context.requireTenantAccess(payload.brandId);
    } else {
      const { data, error } = await supabase
        .from("user_metric_preferences")
        .select("brand_id")
        .eq("id", payload.preferenceId)
        .single();

      if (error) {
        throw new ApiError({
          status: 502,
          code: "UPSTREAM_ERROR",
          message: "Unable to resolve metric preference brand scope.",
          details: { source: "supabase", message: error.message },
          expose: true
        });
      }

      context.requireTenantAccess(data.brand_id);
    }

    deleteQuery = deleteQuery.eq("id", payload.preferenceId);
  } else {
    if (!payload.userId || !payload.brandId || !payload.metricId) {
      throw new ApiError({
        status: 400,
        code: "VALIDATION_ERROR",
        message:
          "Either 'preferenceId' or ('userId', 'brandId', 'metricId') fields are required for deletion.",
        expose: true
      });
    }

    context.requireTenantAccess(payload.brandId);

    deleteQuery = deleteQuery
      .eq("user_id", payload.userId)
      .eq("brand_id", payload.brandId)
      .eq("metric_id", payload.metricId);
  }

  const { error } = await deleteQuery;

  if (error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to delete metric preference.",
      details: { source: "supabase", message: error.message },
      expose: true
    });
  }

  return {
    data: {
      deleted: true
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 50,
    windowMs: 60_000,
    keyPrefix: "dashboard-metric-preferences-delete"
  },
  audit: {
    action: "dashboard.metric_preferences.delete"
  }
});
