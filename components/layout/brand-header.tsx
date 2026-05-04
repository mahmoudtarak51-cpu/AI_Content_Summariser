import { SignOutButton } from "@/components/auth/sign-out-button";

type BrandHeaderProps = {
  userEmail: string | null;
  onSignedOut: () => void;
};

export function BrandHeader({ userEmail, onSignedOut }: BrandHeaderProps) {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-600">AI Topic Summariser</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">Grounded topic summaries</h2>
      </div>

      {userEmail ? (
        <div className="flex items-center gap-3">
          <span className="pill" aria-label="Signed in user">
            {userEmail}
          </span>
          <SignOutButton onSignedOut={onSignedOut} />
        </div>
      ) : (
        <span className="pill" aria-label="Sign-in required">
          Sign in required
        </span>
      )}
    </header>
  );
}