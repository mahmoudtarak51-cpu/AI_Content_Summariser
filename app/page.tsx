"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AppShell } from "@/components/layout/app-shell";
import { BrandHeader } from "@/components/layout/brand-header";
import { Hero } from "@/components/layout/hero";
import { SummarizeForm, type SummarizePayload } from "@/components/controls/summarize-form";
import { OutputCard, type OutputState } from "@/components/output/output-card";

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

export default function Page() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [outputState, setOutputState] = useState<OutputState>({ status: "empty" });
  const [downloadParams, setDownloadParams] = useState<DownloadParams | null>(null);

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
    } catch {
      setOutputState({
        status: "error",
        message: "Could not reach the server. Check your connection and try again.",
      });
    }
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
      rightCard={<OutputCard state={outputState} downloadParams={downloadParams ?? undefined} />}
    />
  );
}
