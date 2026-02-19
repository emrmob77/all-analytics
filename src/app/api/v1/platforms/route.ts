import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { readIntegerParam, readStringParam } from "@/lib/api/validation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type PlatformRow = Database["public"]["Tables"]["platforms"]["Row"];

interface ListPlatformsQueryDto {
  search?: string;
  limit: number;
}

interface PlatformDto {
  id: string;
  key: string;
  name: string;
  logoKey: string | null;
  createdAt: string;
  updatedAt: string;
}

function parseListPlatformsQuery(url: URL): ListPlatformsQueryDto {
  const params = url.searchParams;

  return {
    search: readStringParam(params, "search", { maxLength: 64 }),
    limit: readIntegerParam(params, "limit", { min: 1, max: 100 }) ?? 50
  };
}

function mapPlatformRow(row: PlatformRow): PlatformDto {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    logoKey: row.logo_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const GET = createApiHandler(async (request) => {
  const query = parseListPlatformsQuery(new URL(request.url));

  let platformsQuery = supabase
    .from("platforms")
    .select("id, key, name, logo_key, created_at, updated_at")
    .order("name", { ascending: true })
    .limit(query.limit);

  if (query.search) {
    platformsQuery = platformsQuery.ilike("name", `%${query.search}%`);
  }

  const { data, error } = await platformsQuery;

  if (error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to fetch platforms.",
      details: { source: "supabase", message: error.message },
      expose: true
    });
  }

  return {
    data: {
      items: (data ?? []).map(mapPlatformRow),
      count: data?.length ?? 0,
      filters: query
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 120,
    windowMs: 60_000,
    keyPrefix: "platforms-list"
  }
});
