/**
 * lib/openrouter/prompt.ts
 *
 * Builds the OpenRouter messages array for a summarize request.
 * The system prompt enforces English-only output, forbids citations and URLs,
 * and grounds the model on the provided search context.
 *
 * Mode-specific instructions are applied per output mode.
 * T030 (US2) will expand each mode with additional detail.
 */
import "server-only";

import type { OpenRouterMessage } from "@/lib/openrouter/client";
import type { OutputMode } from "@/lib/validation/summarize-request";

export interface BuildPromptParams {
  topic: string;
  mode: OutputMode;
  /** Compact numbered search context from buildSearchContext(). */
  context: string;
  /** Human-readable verbosity description from mapLengthToConfig(). */
  lengthDescription: string;
}

const MODE_INSTRUCTIONS: Record<OutputMode, string> = {
  summary: [
    "Write a cohesive prose summary using clear, connected paragraphs.",
    "Open with the single most important insight, then build supporting context in the following paragraphs.",
    "Use smooth transitions between ideas so the text reads as one unified piece.",
    "Do NOT use bullet points, numbered lists, headers, or any markdown formatting.",
  ].join(" "),

  "bullet-list": [
    "Write the output as a structured bullet list using a hyphen and space ('- ') at the start of each item.",
    "Aim for 4–8 bullets. Each bullet must be a self-contained, standalone point — no sub-bullets.",
    "Begin each bullet with a capital letter. Keep each bullet to one or two concise sentences.",
    "Do NOT use paragraph prose, headers, or numbered items.",
  ].join(" "),

  "one-liner": [
    "Write EXACTLY one sentence that captures the single most important point about the topic.",
    "The sentence should be 20–40 words, direct, and immediately understandable.",
    "Do NOT add any follow-up sentences, bullet points, or additional explanation.",
  ].join(" "),

  "mind-map": [
    "Write the output as a nested plain-text outline.",
    "Use '- ' (hyphen + space) for each top-level theme. Use '  - ' (two spaces + hyphen + space) for sub-items under each theme.",
    "Include 3–5 top-level themes. Each theme should have 2–4 supporting sub-items.",
    "Keep each item to a short phrase — no full sentences. Do NOT use prose paragraphs or bullet-list format.",
  ].join(" "),

  meme: [
    "Write a short, punchy two-line meme-style caption in the classic TOP TEXT / BOTTOM TEXT pattern.",
    "Line 1: a bold, declarative setup (the 'top text'). Line 2: the punchline or twist (the 'bottom text').",
    "Keep each line under 10 words. Tone should be witty, ironic, or cleverly exaggerated.",
    "No images, no links, no hashtags, no emojis. Plain text only.",
  ].join(" "),
};

/**
 * Builds the messages array to send to OpenRouter.
 *
 * System prompt: grounding rules + mode + length instructions.
 * User message:  the topic.
 */
export function buildPrompt(params: BuildPromptParams): OpenRouterMessage[] {
  const { topic, mode, context, lengthDescription } = params;

  const modeInstruction = MODE_INSTRUCTIONS[mode];

  const systemPrompt = [
    "You are a research assistant that produces accurate, grounded summaries.",
    "",
    "## Rules",
    "- Write ONLY in English. Never output text in any other language.",
    "- Base your response ENTIRELY on the search results provided below. Do not invent facts.",
    "- Do NOT include any URLs, citations, or source references in your output.",
    "- Do NOT mention the existence of search results or that you were given sources.",
    "- Target length: " + lengthDescription + ".",
    "",
    "## Output format",
    modeInstruction,
    "",
    "## Search results",
    context,
  ].join("\n");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Summarize: ${topic}` },
  ];
}
