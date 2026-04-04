"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSubscription, PLAN_DETAILS } from "@/lib/subscription-context";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <SubscribePageContent />
    </Suspense>
  );
}

function SubscribePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const assessmentParams = searchParams.toString();

  useEffect(() => {
    if (!authLoading && !subLoading && isSubscribed) {
      if (assessmentParams) {
        router.push(`/assessment-results?${assessmentParams}`);
      } else {
        router.push("/dashboard");
      }
    }
  }, [authLoading, subLoading, isSubscribed, assessmentParams, router]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/register");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchClientSecret = useCallback(async () => {
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ assessmentParams }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error ?? "Failed to start checkout");
        setShowCheckout(false);
        return "";
      }
      return data.clientSecret as string;
    } catch {
      setCheckoutError("Network error. Please try again.");
      setShowCheckout(false);
      return "";
    }
  }, [assessmentParams]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-primary-700 hover:text-primary-800 text-sm"
          >
            Back to Dashboard
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Unlock Your Personalized Results
            </h1>
            <p className="text-gray-600 text-lg">
              Your assessment is complete. Subscribe to access your full results,
              treatment plan, and specialist care.
            </p>
          </div>

          <Card className="border-2 border-primary-500 shadow-xl mb-6">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="text-center mb-6">
                <span className="inline-block bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  All-inclusive
                </span>
                <h2 className="text-2xl font-bold text-gray-900">
                  {PLAN_DETAILS.name}
                </h2>
              </div>

              <div className="bg-primary-50 rounded-xl p-5 mb-6 text-center">
                <div className="mb-1">
                  <span className="text-4xl font-bold text-primary-900">
                    ${PLAN_DETAILS.introPrice}
                  </span>
                  <span className="text-primary-700 text-sm ml-1">
                    / first {PLAN_DETAILS.introMonths} months
                  </span>
                </div>
                <div className="text-sm text-primary-600 font-medium">
                  then ${PLAN_DETAILS.monthlyPrice}/month
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {PLAN_DETAILS.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {!showCheckout && (
                <Button
                  className="w-full text-base py-6"
                  onClick={() => setShowCheckout(true)}
                >
                  Get Started — Subscribe Now
                </Button>
              )}

              {checkoutError && (
                <p className="text-sm text-red-600 text-center mt-3">
                  {checkoutError}
                </p>
              )}
            </CardContent>
          </Card>

          {showCheckout && (
            <div id="stripe-checkout-container">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
