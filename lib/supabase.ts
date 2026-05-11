import { createClient } from "@supabase/supabase-js";

// Public, read-only client used in Server Components + middleware.
// Always anon key — never service role.
export const supabasePublic = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-client-info": "geo-sites" } },
    }
  );
