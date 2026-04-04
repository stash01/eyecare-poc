"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SubscribeReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <ReturnContent />
    </Suspense>
  );
}

function ReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    fetch(`/api/stripe/checkout-status?session_id=${sessionId}`)
      .then((r) => r.json())
      .then(async (data) => {
        if (data.status === "complete") {
          await refreshUser();
          setStatus("success");

          // Forward remaining query params (assessmentParams) if present
          const forward = new URLSearchParams(searchParams.toString());
          forward.delete("session_id");
          const target = forward.toString()
            ? `/assessment-results?${forward.toString()}`
            : "/dashboard";

          setTimeout(() => router.push(target), 2500);
        } else if (data.status === "open") {
          // Payment not completed — send back to subscribe
          router.push("/subscribe");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Eye className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
        </Link>

        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Confirming your subscription…
            </h1>
            <p className="text-gray-500 text-sm">Just a moment</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Klara Membership!
            </h1>
            <p className="text-gray-600 mb-6">
              Your subscription is active. Redirecting you now…
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary-600 mx-auto" />
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t confirm your subscription. If you were charged,
              please contact support.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => router.push("/subscribe")}>
                Try Again
              </Button>
              <Button onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
