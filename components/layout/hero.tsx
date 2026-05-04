type HeroProps = {
  className?: string;
};

const BADGES = [
  "Brave Search",
  "10 web results",
  "5 output modes",
  "English only",
  "10 summaries / day",
] as const;

export function Hero({ className }: HeroProps) {
  return (
    <div className={className}>
      <h1 className="text-3xl font-bold tracking-tight text-text-base sm:text-4xl">
        AI Topic Summariser
      </h1>
      <p className="mt-3 max-w-xl text-base text-text-muted">
        Enter any topic and get a grounded, source-checked summary powered by
        live web results and your choice of AI model.
      </p>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Feature highlights">
        {BADGES.map((label) => (
          <span key={label} className="pill">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
