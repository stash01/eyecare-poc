import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key.
// The service role bypasses Row-Level Security — never expose this key to the browser.
// All imports of this module must be from server-only files (route.ts, server components, middleware).

let _client: SupabaseClient | null = null;

// Lazy initialization — env vars are only validated at request time, not at build time.
export function getDb(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env: SUPABASE_URL");
  if (!key) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  _client = createClient(url, key, {
    auth: {
      // Disable Supabase Auth — we manage sessions ourselves
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}

// Convenience alias — most routes use `db` directly
export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
