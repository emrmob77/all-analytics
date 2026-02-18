import { createClient } from "@supabase/supabase-js";

import type { Database } from "../types/supabase";

const env = (
  globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env ?? {};

const hasSupabaseEnv = Boolean(
  (env.NEXT_PUBLIC_SUPABASE_URL ?? env.VITE_SUPABASE_URL) &&
    (env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY)
);

const supabaseUrl =
  env.NEXT_PUBLIC_SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

if (!hasSupabaseEnv && typeof window !== "undefined") {
  console.warn("Supabase env variables missing. Falling back to mock-safe client configuration.");
}
