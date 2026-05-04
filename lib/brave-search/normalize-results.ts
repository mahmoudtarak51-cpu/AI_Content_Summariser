/**
 * lib/brave-search/normalize-results.ts
 *
 * Converts raw Brave Search API items into clean internal SearchResultDocument
 * objects.  URLs are kept internally for deduplication but must never be
 * returned to the UI or included in generated output.
 */

/** Shape of each item as returned by the Brave Web Search API. */
export interface RawBraveResult {
  title: string;
  url: string;
  description: string | null;
  extra_snippets: string[];
}

/** Internal clean representation of one search result. */
export interface SearchResultDocument {
  rank: number;
  title: string;
  /** Best available text snippet for the document. */
  snippet: string;
  /** Internal-only URL — never sent to the client. */
  url: string;
}

/** Minimum number of usable results before the weak-results path fires. */
export const WEAK_RESULTS_THRESHOLD = 3;

/**
 * Normalizes raw Brave results into clean internal documents.
 * Results with no usable text are dropped.
 */
export function normalizeResults(
  raw: RawBraveResult[],
): SearchResultDocument[] {
  const docs: SearchResultDocument[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    const snippet = bestSnippet(item);
    if (!snippet) continue;

    docs.push({
      rank: docs.length + 1,
      title: item.title.trim(),
      snippet,
      url: item.url,
    });
  }

  return docs;
}

/**
 * Returns true when there are not enough usable results to ground a summary.
 */
export function isWeakResultSet(docs: SearchResultDocument[]): boolean {
  return docs.length < WEAK_RESULTS_THRESHOLD;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function bestSnippet(item: RawBraveResult): string | null {
  const candidates = [
    item.description,
    ...item.extra_snippets,
  ].filter((s): s is string => typeof s === "string" && s.trim().length > 20);

  return candidates[0]?.trim() ?? null;
}
