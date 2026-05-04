/**
 * lib/validation/topic.ts
 *
 * Zod schema and helpers for validating the `topic` field that a user submits
 * to /api/summarize.
 *
 * Rules (from spec & contract):
 *  - Trimmed length: 2 – 200 characters
 *  - Must not be a bare URL (http/https/www prefix)
 *  - Must not look like a pasted article body (very long, many newlines)
 */
import { z } from "zod";

// Detects strings that are primarily a URL.
const URL_PATTERN = /^\s*https?:\/\/\S+\s*$|^\s*www\.\S+\s*$/i;

export const topicSchema = z
  .string()
  .transform((v) => v.trim())
  .pipe(
    z
      .string()
      .min(2, "Please enter a topic before summarizing.")
      .max(200, "Topic must be 200 characters or fewer.")
      .refine((v) => !URL_PATTERN.test(v), {
        message: "Please enter a topic phrase, not a URL.",
      }),
  );

export type Topic = z.infer<typeof topicSchema>;
