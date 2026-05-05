"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AppShell } from "@/components/layout/app-shell";
import { BrandHeader } from "@/components/layout/brand-header";
import { Hero } from "@/components/layout/hero";
import { SummarizeForm, type SummarizePayload } from "@/components/controls/summarize-form";
import { OutputCard, type OutputState } from "@/components/output/output-card";
import { HistoryPanel, type HistoryEntry } from "@/components/history/history-panel";

type MeResponse = {
  authenticated: boolean;
  user: {
    id: string;
    email: string | null;
  } | null;
};

type SummarizeApiResponse =
  | { output: string }
  | { code: string; message: string };

type DownloadParams = {
  topic: string;
  mode: string;
  model: string;
};

type RightTab = "output" | "history";

export default function Page() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [outputState, setOutputState] = useState<OutputState>({ status: "empty" });
  const [downloadParams, setDownloadParams] = useState<DownloadParams | null>(null);
  const [activeTab, setActiveTab] = useState<RightTab>("output");
  // Bump this to force the HistoryPanel to re-fetch after a new summary is saved.
  const [historyKey, setHistoryKey] = useState(0);

  const refreshSession = useCallback(async () => {
    setIsCheckingSession(true);

    try {
      const response = await fetch("/api/me", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setIsAuthenticated(false);
        setEmail(null);
        return;
      }

      const data = (await response.json()) as MeResponse;
      setIsAuthenticated(data.authenticated);
      setEmail(data.user?.email ?? null);
    } catch {
      setIsAuthenticated(false);
      setEmail(null);
    } finally {
      setIsCheckingSession(false);
    }
  }, []);

  const handleSummarize = useCallback(async (payload: SummarizePayload) => {
    setOutputState({ status: "loading" });

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: payload.topic,
          model: payload.model,
          mode: payload.mode,
          length: payload.length,
          language: "en",
        }),
      });

      const data = (await response.json()) as SummarizeApiResponse;

      if (!response.ok) {
        const errorData = data as { code: string; message: string };
        if (response.status === 401) {
          // Session expired — reset to unauthenticated
          setIsAuthenticated(false);
          setEmail(null);
          setOutputState({ status: "empty" });
          setDownloadParams(null);
          return;
        }
        setOutputState({ status: "error", message: errorData.message ?? "Something went wrong. Please try again." });
        return;
      }

      const successData = data as { output: string };
      setOutputState({ status: "success", output: successData.output });
      setDownloadParams({ topic: payload.topic, mode: payload.mode, model: payload.model });
      setActiveTab("output");
      // Bump key to force HistoryPanel to re-fetch next time it is shown.
      setHistoryKey((k) => k + 1);
    } catch {
      setOutputState({
        status: "error",
        message: "Could not reach the server. Check your connection and try again.",
      });
    }
  }, []);

  const handleRestore = useCallback((entry: HistoryEntry) => {
    setOutputState({ status: "success", output: entry.output });
    setDownloadParams({ topic: entry.topic, mode: entry.mode, model: entry.model });
    setActiveTab("output");
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return (
    <AppShell
      header={
        <BrandHeader
          userEmail={isAuthenticated ? email : null}
          onSignedOut={() => {
            setIsAuthenticated(false);
            setEmail(null);
            setOutputState({ status: "empty" });
            setDownloadParams(null);
            void refreshSession();
          }}
        />
      }
      hero={isAuthenticated ? <Hero className="mb-2" /> : undefined}
      leftCard={
        isCheckingSession ? (
          <p className="text-sm text-text-muted">Checking session…</p>
        ) : isAuthenticated ? (
          <SummarizeForm
            onSubmit={(payload) => void handleSummarize(payload)}
            isLoading={outputState.status === "loading"}
          />
        ) : (
          <AuthCard onSignedIn={() => void refreshSession()} />
        )
      }
      rightCard={
        <div className="flex h-full flex-col">
          {/* Tab bar — only shown when authenticated */}
          {isAuthenticated && (
            <div
              role="tablist"
              aria-label="Right panel tabs"
              className="mb-5 flex gap-1 rounded-[var(--radius-control)] bg-pill-bg p-1"
            >
              {(["output", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "flex-1 rounded-[calc(var(--radius-control)-2px)] px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    activeTab === tab
                      ? "bg-white text-accent shadow-sm"
                      : "text-text-muted hover:text-text-base",
                  ].join(" ")}
                >
                  {tab === "history" ? "History" : "Output"}
                </button>
              ))}
            </div>
          )}

          {/* Tab panels */}
          {activeTab === "output" || !isAuthenticated ? (
            <OutputCard
              state={outputState}
              downloadParams={downloadParams ?? undefined}
              hideHeader={isAuthenticated}
            />
          ) : (
            <div role="tabpanel" aria-label="Summary history">
              <HistoryPanel key={historyKey} onRestore={handleRestore} />
            </div>
          )}
        </div>
      }
    />
  );
}
