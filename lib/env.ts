/**
 * lib/env.ts
 *
 * Central environment-variable validation using Zod.
 *
 * SERVER variables are validated only on the server.  Importing this module
 * in a Client Component will throw a build error because Next.js tree-shakes
 * server-only imports correctly when you add `import "server-only"` (see
 * lib/auth/server.ts and lib/brave-search/client.ts for examples).
 *
 * PUBLIC variables (NEXT_PUBLIC_*) are validated here too so the app fails
 * fast at startup instead of at runtime with an opaque error.
 */

import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const serverEnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  BRAVE_SEARCH_API_KEY: z.string().min(1).optional(),
  EXA_API_KEY: z.string().min(1).optional(),
}).superRefine((env, ctx) => {
  if (!env.BRAVE_SEARCH_API_KEY && !env.EXA_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["EXA_API_KEY"],
      message:
        "Provide EXA_API_KEY or BRAVE_SEARCH_API_KEY for web search.",
    });
  }
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

// ─── Validation ───────────────────────────────────────────────────────────────

function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  source: Record<string, string | undefined>,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`[env] Missing or invalid ${label} variables:\n${messages}`);
  }
  return result.data;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Server-side environment variables.
 * Only call this from Route Handlers and Server Components.
 * Throws at runtime if accidentally invoked from the browser bundle.
 */
export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error(
      "[env] getServerEnv() must only be called on the server. " +
        "Import server-only modules from server-side files only.",
    );
  }
  return parseEnv(serverEnvSchema, process.env as Record<string, string | undefined>, "server");
}

/**
 * Public environment variables (safe for both server and client).
 */
export const publicEnv = parseEnv(
  publicEnvSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  "public",
);
