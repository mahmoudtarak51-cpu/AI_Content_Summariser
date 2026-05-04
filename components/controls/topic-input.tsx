"use client";

import { ChangeEvent } from "react";

export type TopicInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
};

const MAX_TOPIC_LENGTH = 300;

export function TopicInput({ value, onChange, disabled = false, error }: TopicInputProps) {
  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  const describedBy = error ? "topic-error topic-hint" : "topic-hint";

  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium text-text-base"
        htmlFor="topic-input"
      >
        Topic
      </label>
      <textarea
        id="topic-input"
        name="topic"
        rows={3}
        maxLength={MAX_TOPIC_LENGTH}
        className="input-base w-full resize-none"
        placeholder="e.g. The history of quantum computing"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        aria-required
      />
      <p id="topic-hint" className="mt-1 text-xs text-text-subtle">
        Enter a topic to summarize — no URLs or file uploads needed.
      </p>
    </div>
  );
}
