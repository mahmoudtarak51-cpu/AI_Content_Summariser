'use client';

import React, { useMemo } from 'react';

interface LengthSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

const BAND_DESCRIPTIONS: Record<string, string> = {
  Micro: 'Very brief — one or two sentences',
  Short: 'Concise — a short paragraph',
  Medium: 'Balanced — two to three paragraphs',
  Long: 'Detailed — several paragraphs with context',
  Extended: 'Comprehensive — thorough and in-depth',
};

export function LengthSlider({
  value,
  onValueChange,
  disabled = false,
}: LengthSliderProps) {
  const currentBand = useMemo(() => {
    if (value < 20) return 'Micro';
    if (value < 40) return 'Short';
    if (value < 60) return 'Medium';
    if (value < 80) return 'Long';
    return 'Extended';
  }, [value]);

  return (
    <div className="space-y-2">
      <span className="control-label">Output Length</span>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onValueChange(Number(e.target.value))}
            disabled={disabled}
            className="slider"
            style={{
              background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${value}%, var(--color-card-border) ${value}%, var(--color-card-border) 100%)`,
            }}
            aria-label="Output length"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            aria-valuetext={currentBand}
          />
          <div className="mt-1 flex justify-between text-xs text-text-subtle">
            <span>Micro</span>
            <span>Extended</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[var(--radius-control)] border border-[color:var(--color-card-border)] bg-[color:var(--color-accent-light)] px-3 py-2">
          <span className="text-sm text-text-muted">{BAND_DESCRIPTIONS[currentBand]}</span>
          <span className="pill ml-3 shrink-0">{currentBand}</span>
        </div>
      </div>
    </div>
  );
}
