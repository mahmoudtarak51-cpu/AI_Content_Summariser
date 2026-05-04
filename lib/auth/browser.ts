/**
 * lib/auth/browser.ts
 *
 * Supabase client for use inside Client Components and browser-side code.
 * Uses @supabase/ssr createBrowserClient so cookies are handled correctly
 * for App Router.
 */
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
