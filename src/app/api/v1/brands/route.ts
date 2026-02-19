import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { readIntegerParam, readStringParam } from "@/lib/api/validation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];

interface ListBrandsQueryDto {
  search?: string;
  limit: number;
}

interface BrandDto {
  id: string;
  name: string;
  avatar: string | null;
  activeAdmins: number;
  createdAt: string;
  updatedAt: string;
}

function parseListBrandsQuery(url: URL): ListBrandsQueryDto {
  const params = url.searchParams;

  return {
    search: readStringParam(params, "search", { maxLength: 64 }),
    limit: readIntegerParam(params, "limit", { min: 1, max: 100 }) ?? 50
  };
}

function mapBrandRow(row: BrandRow): BrandDto {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    activeAdmins: row.active_admins,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const GET = createApiHandler(async (request) => {
  const query = parseListBrandsQuery(new URL(request.url));

  let brandsQuery = supabase
    .from("brands")
    .select("id, name, avatar, active_admins, created_at, updated_at")
    .order("name", { ascending: true })
    .limit(query.limit);

  if (query.search) {
    brandsQuery = brandsQuery.ilike("name", `%${query.search}%`);
  }

  const { data, error } = await brandsQuery;

  if (error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to fetch brands.",
      details: { source: "supabase", message: error.message },
      expose: true
    });
  }

  return {
    data: {
      items: (data ?? []).map(mapBrandRow),
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
    keyPrefix: "brands-list"
  }
});
