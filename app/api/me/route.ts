/**
 * app/api/me/route.ts
 *
 * GET /api/me
 *
 * Returns the current session state for client bootstrap and integration tests.
 * Never returns sensitive server secrets.
 *
 * Responses:
 *   200 { authenticated: true,  user: { id, email } }
 *   200 { authenticated: false, user: null }
 *   500 { code: "unknown_error", message: "..." }
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error && error.message !== "Auth session missing!") {
      // Unexpected auth error — log server-side only, return generic 500.
      console.error("[/api/me] getUser error:", error.message);
      return NextResponse.json(
        { code: "unknown_error", message: "Session check failed" },
        { status: 500 },
      );
    }

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email ?? null,
      },
    });
  } catch (err) {
    console.error("[/api/me] unexpected error:", err);
    return NextResponse.json(
      { code: "unknown_error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
