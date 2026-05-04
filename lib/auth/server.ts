/**
 * lib/auth/server.ts
 *
 * Supabase client for use in Route Handlers and Server Components.
 * Uses @supabase/ssr createServerClient with Next.js cookies() so the
 * session is always read from the request and written back on mutation.
 *
 * This file must only ever be imported server-side.  Next.js enforces this
 * at build time because it uses cookies() from next/headers.
 */
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll is called from Server Components where cookie mutation is
            // a no-op.  The middleware handles actual refresh writes.
          }
        },
      },
    },
  );
}
