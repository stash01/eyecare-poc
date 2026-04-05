"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

export function ImpersonationBanner() {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    fetch("/api/admin/impersonate/status", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        setIsImpersonating(data.isImpersonating ?? false);
        setDisplayName(data.displayName ?? null);
      })
      .catch(() => {});
  }, []);

  if (!isImpersonating) return null;

  const handleReturn = async () => {
    setReturning(true);
    try {
      const res = await fetch("/api/admin/impersonate/return", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.redirectTo) router.push(data.redirectTo);
    } catch {
      setReturning(false);
    }
  };

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-amber-900 text-sm font-medium shadow-md">
      <Shield className="h-4 w-4 flex-shrink-0" />
      <span>
        Viewing as <strong>{displayName ?? "..."}</strong>
      </span>
      <span className="text-amber-700">—</span>
      <button
        onClick={handleReturn}
        disabled={returning}
        className="underline underline-offset-2 hover:text-amber-950 disabled:opacity-60 transition-colors"
      >
        {returning ? "Returning…" : "Return to Admin"}
      </button>
    </div>
  );
}
