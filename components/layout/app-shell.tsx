import { ReactNode } from "react";

type AppShellProps = {
  header: ReactNode;
  hero?: ReactNode;
  leftCard: ReactNode;
  rightCard: ReactNode;
};

export function AppShell({ header, hero, leftCard, rightCard }: AppShellProps) {
  return (
    <main className="min-h-screen bg-app-bg px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {header}

        {hero && <div className="mb-6 sm:mb-8">{hero}</div>}

        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <section className="card p-5 sm:p-7" aria-label="Summary controls">
            {leftCard}
          </section>

          <div className="card sticky top-8 min-h-[18rem] p-5 sm:p-7">
            {rightCard}
          </div>
        </div>
      </div>
    </main>
  );
}
