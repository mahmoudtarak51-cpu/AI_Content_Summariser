"use client";

import { useCallback, useEffect, useState } from "react";

export type HistoryEntry = {
  id: string;
  topic: string;
  mode: string;
  model: string;
  length: string;
  output: string;
  created_at: string;
};

type HistoryPanelProps = {
  onRestore: (entry: HistoryEntry) => void;
};

type ApiResponse =
  | { history: HistoryEntry[] }
  | { code: string; message: string };

export function HistoryPanel({ onRestore }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/history", { cache: "no-store" });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError((data as { code: string; message: string }).message);
        return;
      }
      setEntries((data as { history: HistoryEntry[] }).history);
    } catch {
      setError("Could not load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeleting(id);
      try {
        const res = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setEntries((prev) => prev.filter((e) => e.id !== id));
          if (expanded === id) setExpanded(null);
        }
      } finally {
        setDeleting(null);
      }
    },
    [expanded],
  );

  if (loading) {
    return (
      <p className="text-sm text-text-muted py-4 text-center">
        Loading history…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-error py-4 text-center">{error}</p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-text-muted py-4 text-center">
        No summaries yet. Generate your first one above!
      </p>
    );
  }

  return (
    <ul className="divide-y divide-card-border space-y-0">
      {entries.map((entry) => {
        const isOpen = expanded === entry.id;
        const date = new Date(entry.created_at).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });

        return (
          <li key={entry.id} className="py-3">
            {/* Row header */}
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => setExpanded(isOpen ? null : entry.id)}
                className="flex-1 text-left"
                aria-expanded={isOpen}
              >
                <p className="text-sm font-medium text-text-base line-clamp-1">
                  {entry.topic}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {date} · {entry.mode} · {entry.length}
                </p>
              </button>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => onRestore(entry)}
                  className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                  title="Load this summary into the output panel"
                >
                  Restore
                </button>
                <button
                  onClick={() => void handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="text-xs text-text-muted hover:text-error transition-colors disabled:opacity-40"
                  title="Delete this entry"
                >
                  {deleting === entry.id ? "…" : "Delete"}
                </button>
              </div>
            </div>

            {/* Expanded output */}
            {isOpen && (
              <div className="mt-3 rounded-[var(--radius-control)] bg-pill-bg p-3 text-sm text-text-base whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {entry.output}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
