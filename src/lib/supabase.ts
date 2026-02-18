import { createClient } from "@supabase/supabase-js";

import type { Database } from "../types/supabase";

const env = (
  globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env ?? {};

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check .env.local configuration.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
