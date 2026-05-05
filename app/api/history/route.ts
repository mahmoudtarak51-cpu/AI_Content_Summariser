/**
 * app/api/history/route.ts
 *
 * GET  /api/history        — Returns the authenticated user's summary history
 *                            (most recent first, up to 50 entries).
 * DELETE /api/history?id=  — Deletes a single history entry by id.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { code: "unauthorized", message: "Sign in to view history." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("summary_history")
    .select("id, topic, mode, model, length, output, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[/api/history] select error:", error);
    return NextResponse.json(
      { code: "db_error", message: "Could not fetch history." },
      { status: 502 },
    );
  }

  return NextResponse.json({ history: data });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { code: "unauthorized", message: "Sign in to delete history." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { code: "invalid_request", message: "Missing id parameter." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("summary_history")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // RLS + extra guard

  if (error) {
    console.error("[/api/history] delete error:", error);
    return NextResponse.json(
      { code: "db_error", message: "Could not delete history entry." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
