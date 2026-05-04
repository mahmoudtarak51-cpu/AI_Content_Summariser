"use client";

import { FormEvent, useState } from "react";
import { TopicInput } from "@/components/controls/topic-input";
import { ModelSelector } from "@/components/controls/model-selector";
import { ModeTabs } from "@/components/controls/mode-tabs";
import { LengthSlider } from "@/components/controls/length-slider";
import { DEFAULT_MODEL } from "@/lib/openrouter/allowlist";
import type { OutputMode } from "@/lib/validation/summarize-request";

export type SummarizePayload = {
  topic: string;
  model: string;
  mode: OutputMode;
  length: number;
};

export type SummarizeFormProps = {
  onSubmit: (payload: SummarizePayload) => void;
  isLoading?: boolean;
  disabled?: boolean;
};

export function SummarizeForm({ onSubmit, isLoading = false, disabled = false }: SummarizeFormProps) {
  const [topic, setTopic] = useState("");
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [mode, setMode] = useState<OutputMode>("summary");
  const [length, setLength] = useState(50);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isSubmitDisabled = disabled || isLoading || topic.trim().length === 0;
  const controlsDisabled = disabled || isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const trimmed = topic.trim();
    if (!trimmed) {
      setValidationError("Please enter a topic before summarizing.");
      return;
    }

    onSubmit({ topic: trimmed, model, mode, length });
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <TopicInput
        value={topic}
        onChange={(value) => {
          setTopic(value);
          if (validationError) setValidationError(null);
        }}
        disabled={controlsDisabled}
        error={validationError}
      />

      {validationError && (
        <p id="topic-error" className="text-sm text-error" role="alert">
          {validationError}
        </p>
      )}

      <ModeTabs
        selectedMode={mode}
        onModeChange={setMode}
        disabled={controlsDisabled}
      />

      <LengthSlider
        value={length}
        onValueChange={setLength}
        disabled={controlsDisabled}
      />

      <ModelSelector
        selectedModel={model}
        onModelChange={setModel}
        disabled={controlsDisabled}
      />

      <button
        type="submit"
        className="btn-primary self-start"
        disabled={isSubmitDisabled}
        aria-busy={isLoading}
      >
        {isLoading ? "Summarizing…" : "Summarize"}
      </button>
    </form>
  );
}
