export function EmptyState() {
  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light"
        aria-hidden="true"
      >
        <svg
          className="h-6 w-6 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-text-muted">
        Your summary will appear here
      </p>
      <p className="text-xs text-text-subtle">
        Enter a topic and click <strong className="font-semibold">Summarize</strong> to get started.
      </p>
    </div>
  );
}
