/**
 * lib/openrouter/client.ts
 *
 * Thin server-side client for the OpenRouter Chat Completions API.
 * All secrets stay on the server; this module must never be imported
 * in Client Components.
 */
import "server-only";

import { getServerEnv } from "@/lib/env";
import { isAllowedModel } from "./allowlist";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  /** Maximum tokens the model may generate. */
  max_tokens?: number;
  temperature?: number;
}

export interface OpenRouterResponse {
  /** Generated text content from the first choice. */
  output: string;
}

/**
 * Calls OpenRouter's chat completions endpoint with the given messages.
 *
 * @throws Error with code prefix when the request fails or the model is
 *         not on the allowlist.
 */
export async function callOpenRouter(
  request: OpenRouterRequest,
): Promise<OpenRouterResponse> {
  if (!isAllowedModel(request.model)) {
    throw new Error(`model_not_allowed: ${request.model}`);
  }

  const { OPENROUTER_API_KEY } = getServerEnv();

  let response: Response;
  try {
    response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        // Recommended by OpenRouter for app identification.
        "HTTP-Referer": "https://ai-content-summariser.vercel.app",
        "X-Title": "AI Topic Summariser",
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        ...(request.max_tokens !== undefined && {
          max_tokens: request.max_tokens,
        }),
        ...(request.temperature !== undefined && {
          temperature: request.temperature,
        }),
      }),
    });
  } catch (cause) {
    throw new Error(`model_failed: network error reaching OpenRouter`, {
      cause,
    });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `model_failed: OpenRouter returned ${response.status} — ${body.slice(0, 200)}`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    throw new Error("model_failed: could not parse OpenRouter response", {
      cause,
    });
  }

  const text = extractContent(json);
  if (!text) {
    throw new Error("model_failed: OpenRouter returned no content");
  }

  return { output: text };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function extractContent(json: unknown): string | null {
  if (
    typeof json !== "object" ||
    json === null ||
    !("choices" in json) ||
    !Array.isArray((json as Record<string, unknown>).choices)
  ) {
    return null;
  }

  const choices = (json as { choices: unknown[] }).choices;
  if (choices.length === 0) return null;

  const first = choices[0] as Record<string, unknown>;
  const message = first?.message as Record<string, unknown> | undefined;
  const content = message?.content;

  return typeof content === "string" && content.trim().length > 0
    ? content.trim()
    : null;
}
