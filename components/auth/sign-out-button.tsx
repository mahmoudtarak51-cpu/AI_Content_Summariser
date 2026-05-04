"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/browser";

type SignOutButtonProps = {
  onSignedOut: () => void;
};

export function SignOutButton({ onSignedOut }: SignOutButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      onSignedOut();
      setIsSubmitting(false);
    }
  }

  return (
    <button className="btn-ghost" type="button" onClick={handleSignOut} disabled={isSubmitting}>
      {isSubmitting ? "Signing out..." : "Sign out"}
    </button>
  );
}