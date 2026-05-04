"use client";

type OutputContentProps = {
  output: string;
};

/**
 * Renders the generated summary text in the output panel.
 *
 * Uses whitespace-pre-wrap so that Mind Map nested bullets and
 * Meme / One Liner newlines are preserved exactly as the model returns them.
 */
export function OutputContent({ output }: OutputContentProps) {
  return (
    <div
      className="prose prose-sm max-w-none text-text-base"
      aria-live="polite"
      aria-label="Generated summary"
    >
      <p className="whitespace-pre-wrap leading-relaxed">{output}</p>
    </div>
  );
}
