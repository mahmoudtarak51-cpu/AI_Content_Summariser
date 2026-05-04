/**
 * lib/summaries/map-length.ts
 *
 * Maps a 0–100 integer slider value to a verbosity band and a corresponding
 * token budget that is passed to the OpenRouter request.
 */

export type LengthBand = "micro" | "short" | "medium" | "long" | "extended";

export interface LengthConfig {
  band: LengthBand;
  /** Approximate max tokens to request from the model. */
  maxTokens: number;
  /** Human-readable description used in the system prompt. */
  description: string;
}

/**
 * Maps a slider value (0–100) to a LengthConfig.
 *
 * Bands:
 *   0–19   → micro    (~80 tokens)
 *   20–39  → short    (~200 tokens)
 *   40–59  → medium   (~400 tokens)
 *   60–79  → long     (~700 tokens)
 *   80–100 → extended (~1200 tokens)
 */
export function mapLengthToConfig(lengthValue: number): LengthConfig {
  const clamped = Math.max(0, Math.min(100, Math.round(lengthValue)));

  if (clamped < 20) {
    return { band: "micro", maxTokens: 80, description: "very brief — one or two sentences" };
  }
  if (clamped < 40) {
    return { band: "short", maxTokens: 200, description: "short — a short paragraph" };
  }
  if (clamped < 60) {
    return { band: "medium", maxTokens: 400, description: "medium — two to three paragraphs" };
  }
  if (clamped < 80) {
    return { band: "long", maxTokens: 700, description: "long — several detailed paragraphs" };
  }
  return { band: "extended", maxTokens: 1200, description: "extended — comprehensive and thorough" };
}
