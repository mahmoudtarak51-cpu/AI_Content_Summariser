"use client";

import { useEffect, useMemo, useRef } from "react";
import { EmptyState } from "@/components/output/empty-state";
import { OutputLoading, OutputError } from "@/components/output/output-status";
import { OutputContent } from "@/components/output/output-content";
import { buildSummaryPdfBlob } from "@/lib/pdf/download-summary-pdf";

export type OutputState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; output: string };

type OutputCardProps = {
  state: OutputState;
  downloadParams?: { topic: string; mode: string; model: string };
  /** When true the internal "Output" heading is hidden (e.g. when shown inside a tab panel). */
  hideHeader?: boolean;
};

/**
 * OutputCard renders the right-panel card with the correct state.
 *
 * - empty:   EmptyState placeholder
 * - loading: Spinner + assistive text
 * - error:   Highlighted error message
 * - success: Delegated to OutputContent with PDF download button
 */
export function OutputCard({ state, downloadParams, hideHeader = false }: OutputCardProps) {
  const canDownload = state.status === "success" && downloadParams != null;

  // Build the PDF blob URL whenever a successful output is available.
  // We memoize on the tuple of content that affects the PDF.
  const pdfBlob = useMemo<Blob | null>(() => {
    if (!canDownload) return null;
    return buildSummaryPdfBlob({
      topic: downloadParams.topic,
      mode: downloadParams.mode,
      model: downloadParams.model,
      text: (state as { status: "success"; output: string }).output,
    });
  }, [canDownload, downloadParams, state]);

  // Create / revoke the object URL to avoid memory leaks.
  const blobUrlRef = useRef<string | null>(null);
  const blobUrl = useMemo<string | null>(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (!pdfBlob) return null;
    const url = URL.createObjectURL(pdfBlob);
    blobUrlRef.current = url;
    return url;
  }, [pdfBlob]);

  // Revoke on unmount.
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      {(!hideHeader || (canDownload && blobUrl)) && (
        <div className="mb-4 flex items-center justify-between">
          {!hideHeader && (
            <h2 className="text-base font-semibold text-text-base">Output</h2>
          )}
          {canDownload && blobUrl && (
            <a
              href={blobUrl}
              download="topic-summary.pdf"
              role="button"
              className="btn-ghost text-sm"
            >
              Download PDF
            </a>
          )}
        </div>
      )}
      <div
        className="flex-1"
        role="region"
        aria-label="Summary output"
      >
        {state.status === "empty" && <EmptyState />}
        {state.status === "loading" && <OutputLoading />}
        {state.status === "error" && <OutputError message={state.message} />}
        {state.status === "success" && (
          <OutputContent output={state.output} />
        )}
      </div>
    </div>
  );
}
