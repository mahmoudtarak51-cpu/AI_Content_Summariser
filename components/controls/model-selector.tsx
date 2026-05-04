'use client';

import React from 'react';
import { MODEL_ALLOWLIST } from '@/lib/openrouter/allowlist';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'openai/gpt-oss-120b:free': 'OpenAI GPT-OSS-120B',
  'tencent/hy3-preview:free': 'Tencent Hunyuan-3',
  'minimax/minimax-m2.5:free': 'MiniMax-M2.5',
  'nvidia/nemotron-3-super-120b-a12b:free': 'NVIDIA Nemotron-3',
};

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Model combobox */}
      <div className="space-y-1.5">
        <label
          htmlFor="model-select"
          className="control-label"
        >
          Model
        </label>
        <select
          id="model-select"
          name="model"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled}
          className="input-base w-full cursor-pointer"
          aria-label="Model"
        >
          {MODEL_ALLOWLIST.map((model) => (
            <option key={model} value={model}>
              {MODEL_DISPLAY_NAMES[model] ?? model}
            </option>
          ))}
        </select>
      </div>

      {/* Language — locked to English */}
      <div className="space-y-1.5">
        <label
          htmlFor="language-select"
          className="control-label"
        >
          Language
        </label>
        <select
          id="language-select"
          name="language"
          value="en"
          disabled
          aria-label="Language"
          className="input-base w-full cursor-not-allowed opacity-60"
        >
          <option value="en">English</option>
        </select>
      </div>
    </div>
  );
}
