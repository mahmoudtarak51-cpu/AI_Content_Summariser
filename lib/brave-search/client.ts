/**
 * lib/brave-search/client.ts
 *
 * Server-side web search client.
 * Uses Exa.ai by default (when EXA_API_KEY is set) and falls back to
 * Brave Search when configured.
 * Fetches exactly 10 English results for a topic phrase.
 *
 * Exa API: POST https://api.exa.ai/search
 * Docs: https://docs.exa.ai/reference/search
 */
import "server-only";

import { getServerEnv } from "@/lib/env";
import type { RawBraveResult } from "./normalize-results";

const BRAVE_BASE_URL = "https://api.search.brave.com/res/v1/web/search";
const EXA_BASE_URL = "https://api.exa.ai/search";
const RESULT_COUNT = 10;

export interface BraveSearchParams {
  query: string;
}

/**
 * Fetches up to 10 English web results for the given query.
 *
 * @throws Error with code prefix on network or API failures.
 */
export async function fetchBraveResults(
  params: BraveSearchParams,
): Promise<RawBraveResult[]> {
  const { BRAVE_SEARCH_API_KEY, EXA_API_KEY } = getServerEnv();

  if (EXA_API_KEY) {
    return fetchExaResults(params, EXA_API_KEY);
  }

  if (!BRAVE_SEARCH_API_KEY) {
    throw new Error("search_failed: missing Brave Search API key");
  }

  return fetchFromBrave(params, BRAVE_SEARCH_API_KEY);
}

async function fetchFromBrave(
  params: BraveSearchParams,
  apiKey: string,
): Promise<RawBraveResult[]> {

  const url = new URL(BRAVE_BASE_URL);
  url.searchParams.set("q", params.query);
  url.searchParams.set("count", String(RESULT_COUNT));
  url.searchParams.set("search_lang", "en");
  url.searchParams.set("ui_lang", "en-US");
  url.searchParams.set("country", "US");
  url.searchParams.set("spellcheck", "1");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      // Next.js fetch cache: always fresh for search results.
      cache: "no-store",
    });
  } catch (cause) {
    throw new Error("search_failed: network error reaching Brave Search", {
      cause,
    });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `search_failed: Brave Search returned ${response.status} — ${body.slice(0, 200)}`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    throw new Error("search_failed: could not parse Brave Search response", {
      cause,
    });
  }

  return extractBraveResults(json);
}

async function fetchExaResults(
  params: BraveSearchParams,
  apiKey: string,
): Promise<RawBraveResult[]> {
  let response: Response;
  try {
    response = await fetch(EXA_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: params.query,
        numResults: RESULT_COUNT,
        type: "neural",
        contents: {
          text: { maxCharacters: 1000 },
        },
      }),
      cache: "no-store",
    });
  } catch (cause) {
    throw new Error("search_failed: network error reaching Exa", {
      cause,
    });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `search_failed: Exa returned ${response.status} — ${body.slice(0, 200)}`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    throw new Error("search_failed: could not parse Exa response", {
      cause,
    });
  }

  return extractExaResults(json);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function extractBraveResults(json: unknown): RawBraveResult[] {
  if (typeof json !== "object" || json === null) return [];

  const root = json as Record<string, unknown>;
  const webResults = root?.web as Record<string, unknown> | undefined;
  const results = webResults?.results;

  if (!Array.isArray(results)) return [];

  return results.map((item: unknown) => {
    const r = (item ?? {}) as Record<string, unknown>;
    return {
      title: typeof r.title === "string" ? r.title : "",
      url: typeof r.url === "string" ? r.url : "",
      description: typeof r.description === "string" ? r.description : null,
      extra_snippets: Array.isArray(r.extra_snippets)
        ? (r.extra_snippets as string[]).filter((s) => typeof s === "string")
        : [],
    };
  });
}

function extractExaResults(json: unknown): RawBraveResult[] {
  if (typeof json !== "object" || json === null) return [];

  const root = json as Record<string, unknown>;
  const results = root.results;

  if (!Array.isArray(results)) return [];

  return results.map((item: unknown) => {
    const r = (item ?? {}) as Record<string, unknown>;
    const textContent = r.text as Record<string, unknown> | string | undefined;
    const snippet =
      typeof textContent === "string"
        ? textContent
        : typeof (textContent as Record<string, unknown> | undefined)?.text === "string"
          ? (textContent as Record<string, unknown>).text as string
          : null;
    return {
      title: typeof r.title === "string" ? r.title : "",
      url: typeof r.url === "string" ? r.url : "",
      description: snippet,
      extra_snippets: [],
    };
  });
}
