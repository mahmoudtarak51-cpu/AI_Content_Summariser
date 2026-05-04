'use client';

import React from 'react';

interface ModeTabsProps {
  selectedMode: 'summary' | 'bullet-list' | 'one-liner' | 'mind-map' | 'meme';
  onModeChange: (
    mode: 'summary' | 'bullet-list' | 'one-liner' | 'mind-map' | 'meme'
  ) => void;
  disabled?: boolean;
}

const MODES = [
  {
    id: 'summary',
    label: 'Summary',
    description: 'Concise prose overview',
  },
  {
    id: 'bullet-list',
    label: 'Bullet List',
    description: 'Key points as bullets',
  },
  {
    id: 'one-liner',
    label: 'One Liner',
    description: 'Single sentence essence',
  },
  {
    id: 'mind-map',
    label: 'Mind Map',
    description: 'Nested text outline',
  },
  {
    id: 'meme',
    label: 'Meme',
    description: 'Short, witty text',
  },
] as const;

export function ModeTabs({
  selectedMode,
  onModeChange,
  disabled = false,
}: ModeTabsProps) {
  return (
    <div className="space-y-2">
      <span className="control-label">Output Mode</span>

      <div
        role="tablist"
        aria-label="Output Mode"
        className="grid grid-cols-3 gap-2 sm:grid-cols-5"
      >
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="tab"
            onClick={() => onModeChange(mode.id)}
            disabled={disabled}
            className={`tab-btn${selectedMode === mode.id ? " tab-btn-active" : ""}`}
            title={mode.description}
            aria-selected={selectedMode === mode.id}
            aria-controls={`tabpanel-${mode.id}`}
          >
            <span className="text-center leading-tight">{mode.label}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-text-subtle">
        {MODES.find((m) => m.id === selectedMode)?.description}
      </p>
    </div>
  );
}
