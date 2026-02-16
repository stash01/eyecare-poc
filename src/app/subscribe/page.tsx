"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, CheckCircle, Loader2, Shield, Star } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  useSubscription,
  PLAN_DETAILS,
  SubscriptionPlan,
} from "@/lib/subscription-context";

const planOrder: SubscriptionPlan[] = ["basic", "premium", "complete"];

const planHighlight: Record<SubscriptionPlan, { badge?: string; recommended?: boolean }> = {
  basic: {},
  premium: { badge: "Most Popular", recommended: true },
  complete: { badge: "Best Value" },
};

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <SubscribePageContent />
    </Suspense>
  );
}

function SubscribePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSubscribed, subscribe, isLoading: subLoading } = useSubscription();

  // Build the redirect URL with all assessment params
  const assessmentParams = searchParams.toString();

  // Auto-redirect if already subscribed
  useEffect(() => {
    if (!authLoading && !subLoading && isSubscribed && assessmentParams) {
      router.push(`/assessment-results?${assessmentParams}`);
    }
  }, [authLoading, subLoading, isSubscribed, assessmentParams, router]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/register");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // If already subscribed and redirecting
  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to your results...</p>
        </div>
      </div>
    );
  }

  const handleSubscribe = (plan: SubscriptionPlan) => {
    subscribe(plan);
    if (assessmentParams) {
      router.push(`/assessment-results?${assessmentParams}`);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
          </Link>
          <Link href="/dashboard" className="text-primary-700 hover:text-primary-800 text-sm">
            Back to Dashboard
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Unlock Your Personalized Results
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Your assessment is complete! Subscribe to access your severity score,
              personalized treatment recommendations, and specialist care.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {planOrder.map((planKey) => {
              const plan = PLAN_DETAILS[planKey];
              const highlight = planHighlight[planKey];
              const isRecommended = highlight.recommended;

              return (
                <Card
                  key={planKey}
                  className={`relative ${
                    isRecommended
                      ? "border-2 border-primary-500 shadow-lg scale-105"
                      : "border border-gray-200"
                  }`}
                >
                  {highlight.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          isRecommended
                            ? "bg-primary-600 text-white"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        <Star className="h-3 w-3 inline mr-1" />
                        {highlight.badge}
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isRecommended ? "default" : "secondary"}
                      onClick={() => handleSubscribe(planKey)}
                    >
                      Subscribe to {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Demo mode — no real charges will be made</span>
          </div>
        </div>
      </main>
    </div>
  );
}
