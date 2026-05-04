/**
 * lib/validation/summarize-request.ts
 *
 * Zod schema for the full POST /api/summarize request body.
 * Matches the contract defined in contracts/http-api.yaml.
 */
import { z } from "zod";
import { topicSchema } from "./topic";
import { MODEL_ALLOWLIST } from "@/lib/openrouter/allowlist";

export const OUTPUT_MODES = [
  "summary",
  "bullet-list",
  "one-liner",
  "mind-map",
  "meme",
] as const;

export type OutputMode = (typeof OUTPUT_MODES)[number];

export const summarizeRequestSchema = z.object({
  topic: topicSchema,
  model: z.enum([...MODEL_ALLOWLIST] as [string, ...string[]], {
    errorMap: () => ({ message: "Model is not in the approved allowlist" }),
  }),
  mode: z.enum(OUTPUT_MODES, {
    errorMap: () => ({ message: "Mode must be one of the five approved options" }),
  }),
  length: z
    .number()
    .int("Length must be an integer")
    .min(0, "Length must be at least 0")
    .max(100, "Length must be at most 100"),
  language: z.literal("en", {
    errorMap: () => ({ message: "Language must be en" }),
  }),
});

export type SummarizeRequest = z.infer<typeof summarizeRequestSchema>;
