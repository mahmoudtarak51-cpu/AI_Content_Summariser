/**
 * lib/openrouter/allowlist.ts
 *
 * Server-side model allowlist.  This is product policy — a client-submitted
 * model string is only accepted if it appears here.
 *
 * To retire a model: remove it from MODEL_ALLOWLIST.
 * To add a model: add it here only (no UI changes required for validation).
 */

export const MODEL_ALLOWLIST = [
  "openai/gpt-oss-120b:free",
  "tencent/hy3-preview:free",
  "minimax/minimax-m2.5:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
] as const;

export type AllowedModel = (typeof MODEL_ALLOWLIST)[number];

export const DEFAULT_MODEL: AllowedModel = "openai/gpt-oss-120b:free";

export function isAllowedModel(model: string): model is AllowedModel {
  return (MODEL_ALLOWLIST as readonly string[]).includes(model);
}
