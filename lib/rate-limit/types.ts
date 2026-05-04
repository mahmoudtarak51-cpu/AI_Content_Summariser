/**
 * lib/rate-limit/types.ts
 *
 * Shared types for the daily quota enforcement layer.
 */

/** Result returned by the consume_daily_summary_quota RPC. */
export interface QuotaResult {
  /** True when the request was within the daily limit and was counted. */
  allowed: boolean;
  /** Total requests consumed today (after this call). */
  requestCount: number;
}
