/**
 * middleware.ts  (Next.js Edge Middleware — repo root)
 *
 * Refreshes Supabase auth cookies on every request so the session token
 * stays valid without requiring explicit client-side refreshes.
 *
 * The matcher excludes static assets and Next.js internals to avoid
 * unnecessary cookie parsing on non-page requests.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/auth/middleware";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createSupabaseMiddlewareClient(request, response);

  // Calling getUser() triggers the SSR library's internal token refresh
  // and writes updated cookies into `response` via the setAll handler above.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     *   - _next/static  (static files)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
