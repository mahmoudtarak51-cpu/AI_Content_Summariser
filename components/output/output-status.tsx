export function OutputLoading() {
  return (
    <div
      className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-label="Generating summary"
    >
      <svg
        className="h-6 w-6 animate-spin text-accent"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}

type OutputErrorProps = {
  message: string;
};

export function OutputError({ message }: OutputErrorProps) {
  return (
    <div
      className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 rounded-xl bg-error-bg p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <svg
        className="h-6 w-6 text-error"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <p className="text-sm font-medium text-error">{message}</p>
    </div>
  );
}
