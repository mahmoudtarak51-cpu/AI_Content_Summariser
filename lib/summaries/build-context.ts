/**
 * lib/summaries/build-context.ts
 *
 * Converts normalized search result documents into a compact plain-text
 * context block that is injected into the OpenRouter system prompt.
 *
 * The context intentionally omits URLs so the model cannot reproduce them
 * in its output.
 */
import type { SearchResultDocument } from "@/lib/brave-search/normalize-results";

/**
 * Builds a compact, numbered context block from up to 10 search results.
 *
 * Format:
 *   [1] Title
 *   Snippet text here…
 *
 *   [2] Another Title
 *   Another snippet…
 */
export function buildSearchContext(docs: SearchResultDocument[]): string {
  return docs
    .map((doc) => `[${doc.rank}] ${doc.title}\n${doc.snippet}`)
    .join("\n\n");
}
