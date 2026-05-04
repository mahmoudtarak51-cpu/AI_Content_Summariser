/**
 * lib/rate-limit/consume-daily-quota.ts
 *
 * Wraps the Supabase consume_daily_summary_quota RPC so Route Handlers
 * can call a single typed function instead of raw RPC strings.
 *
 * This module is server-only; it must never be imported in Client Components.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuotaResult } from "./types";

/**
 * Atomically increments today's summary count for the authenticated user.
 *
 * @param supabase  An authenticated Supabase server client.
 * @returns         QuotaResult — allowed + current count.
 * @throws          Error if the RPC call itself fails (network / DB error).
 */
export async function consumeDailyQuota(
  supabase: SupabaseClient,
): Promise<QuotaResult> {
  const { data, error } = await supabase.rpc("consume_daily_summary_quota");

  if (error) {
    throw new Error(`Rate-limit RPC failed: ${error.message}`);
  }

  // The RPC returns a single row via RETURNS TABLE.
  const row = Array.isArray(data) ? data[0] : data;

  if (!row || typeof row.allowed !== "boolean") {
    throw new Error("Rate-limit RPC returned an unexpected shape");
  }

  return {
    allowed: row.allowed as boolean,
    requestCount: (row.request_count as number) ?? 0,
  };
}
