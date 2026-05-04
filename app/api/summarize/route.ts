/**
 * app/api/summarize/route.ts
 *
 * POST /api/summarize
 *
 * Generates one grounded English-only summary from 10 live Brave Search
 * results via an allowlisted OpenRouter model.
 *
 * Pipeline:
 *   1. Verify Supabase session (401 if unauthenticated)
 *   2. Parse + validate request body with Zod (400 on failure)
 *   3. Consume daily quota via Supabase RPC (429 on limit exceeded)
 *   4. Fetch 10 English web results from Brave Search (502 on failure)
 *   5. Normalize + reject weak result sets (400 on weak results)
 *   6. Build search context and prompt
 *   7. Call OpenRouter and return { output } (502 on model failure)
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";
import { summarizeRequestSchema } from "@/lib/validation/summarize-request";
import { consumeDailyQuota } from "@/lib/rate-limit/consume-daily-quota";
import { fetchBraveResults } from "@/lib/brave-search/client";
import {
  normalizeResults,
  isWeakResultSet,
} from "@/lib/brave-search/normalize-results";
import { buildSearchContext } from "@/lib/summaries/build-context";
import { mapLengthToConfig } from "@/lib/summaries/map-length";
import { buildPrompt } from "@/lib/openrouter/prompt";
import { callOpenRouter } from "@/lib/openrouter/client";

export async function POST(request: Request) {
  // ── 1. Auth check ────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { code: "unauthorized", message: "Sign in to use the summarizer." },
      { status: 401 },
    );
  }

  // ── 2. Parse and validate body ───────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { code: "invalid_request", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = summarizeRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message = issue?.message ?? "Invalid request payload.";

    // Surface a stable code for common cases the client can handle distinctly.
    let code = "invalid_request";
    if (issue?.path[0] === "topic") {
      code = "empty_topic";
    } else if (issue?.path[0] === "model") {
      code = "model_not_allowed";
    }

    return NextResponse.json({ code, message }, { status: 400 });
  }

  const { topic, model, mode, length } = parsed.data;

  // ── 3. Consume daily quota ───────────────────────────────────────────────
  let quotaResult: Awaited<ReturnType<typeof consumeDailyQuota>>;
  try {
    quotaResult = await consumeDailyQuota(supabase);
  } catch (err) {
    console.error("[/api/summarize] quota RPC error:", err);
    return NextResponse.json(
      {
        code: "quota_error",
        message: "Could not check your daily quota. Please try again.",
      },
      { status: 502 },
    );
  }

  if (!quotaResult.allowed) {
    return NextResponse.json(
      {
        code: "rate_limited",
        message:
          "You have reached your daily limit of 10 summaries. Try again tomorrow.",
      },
      { status: 429 },
    );
  }

  // ── 4. Brave Search ──────────────────────────────────────────────────────
  let rawResults: Awaited<ReturnType<typeof fetchBraveResults>>;
  try {
    rawResults = await fetchBraveResults({ query: topic });
  } catch (err) {
    console.error("[/api/summarize] Brave Search error:", err);
    return NextResponse.json(
      {
        code: "search_failed",
        message: "Could not retrieve search results. Please try again.",
      },
      { status: 502 },
    );
  }

  // ── 5. Normalize and weak-result check ───────────────────────────────────
  const docs = normalizeResults(rawResults);
  if (isWeakResultSet(docs)) {
    return NextResponse.json(
      {
        code: "weak_results",
        message:
          "Not enough useful search results for this topic. Try a more specific term.",
      },
      { status: 400 },
    );
  }

  // ── 6. Build context + prompt ────────────────────────────────────────────
  const context = buildSearchContext(docs);
  const lengthConfig = mapLengthToConfig(length);
  const messages = buildPrompt({
    topic,
    mode,
    context,
    lengthDescription: lengthConfig.description,
  });

  // ── 7. Call OpenRouter ───────────────────────────────────────────────────
  let result: Awaited<ReturnType<typeof callOpenRouter>>;
  try {
    result = await callOpenRouter({
      model,
      messages,
      max_tokens: lengthConfig.maxTokens,
      temperature: 0.4,
    });
  } catch (err) {
    console.error("[/api/summarize] OpenRouter error:", err);
    return NextResponse.json(
      {
        code: "model_failed",
        message:
          "The AI model could not generate a summary. Please try again.",
      },
      { status: 502 },
    );
  }

  // No-persistence guard: the generated output is returned to the client only.
  // It is never written to the database, logged, or stored server-side.
  return NextResponse.json({ output: result.output });
}
