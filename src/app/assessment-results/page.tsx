"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  ShoppingCart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  ArrowRight,
  User,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/subscription-context";
import { useCart } from "@/lib/cart-context";
import { getSeverity, Severity } from "@/lib/assessment-utils";
import {
  PRODUCTS,
  PROVIDERS,
  PRESCRIPTION_TREATMENTS,
  PROCEDURAL_TREATMENTS,
  MGD_INFO,
  Product,
} from "@/lib/constants";

const severityConfig: Record<
  Severity,
  { label: string; color: string; bgColor: string; borderColor: string; description: string }
> = {
  mild: {
    label: "Mild",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    description:
      "Your symptoms suggest mild dry eye. Simple lifestyle changes and over-the-counter treatments can provide significant relief.",
  },
  moderate: {
    label: "Moderate",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    description:
      "Your symptoms suggest moderate dry eye. A combination of OTC products, lid care, and potentially prescription treatments may be beneficial.",
  },
  severe: {
    label: "Severe",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    description:
      "Your symptoms suggest severe dry eye requiring comprehensive treatment. We strongly recommend a specialist consultation alongside these recommendations.",
  },
};

function getRecommendedProducts(severity: Severity): Product[] {
  const artificialTears = PRODUCTS.filter((p) => p.category === "artificial-tears");
  const warmCompresses = PRODUCTS.filter((p) => p.category === "warm-compresses");
  const lidCare = PRODUCTS.filter((p) => p.category === "lid-care");
  const supplements = PRODUCTS.filter((p) => p.category === "supplements");

  if (severity === "mild") {
    return [...artificialTears.slice(0, 2), ...warmCompresses.slice(0, 1)];
  }
  if (severity === "moderate") {
    return [
      ...artificialTears.slice(0, 2),
      ...warmCompresses.slice(0, 1),
      ...lidCare.slice(0, 2),
      ...supplements.slice(0, 1),
    ];
  }
  // severe
  return [
    ...artificialTears.slice(0, 3),
    ...warmCompresses,
    ...lidCare.slice(0, 2),
    ...supplements.slice(0, 2),
  ];
}

export default function AssessmentResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <AssessmentResultsContent />
    </Suspense>
  );
}

function AssessmentResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const { addItem } = useCart();

  const totalScore = parseInt(searchParams.get("score") || "0");
  const deq5Score = parseInt(searchParams.get("deq5") || "0");
  const deq5Positive = searchParams.get("deq5Positive") === "true";
  const hasAutoimmune = searchParams.get("autoimmune") === "true";
  const hasDiabetes = searchParams.get("diabetes") === "true";
  const hasMGD = searchParams.get("mgd") === "true";
  const hasTriedTreatments = searchParams.get("triedTreatments") === "true";

  const riskFactorCount = [hasAutoimmune, hasDiabetes, hasTriedTreatments, hasMGD].filter(Boolean).length;
  const severity = getSeverity(totalScore, deq5Score, deq5Positive, riskFactorCount);
  const config = severityConfig[severity];
  const recommendedProducts = useMemo(() => getRecommendedProducts(severity), [severity]);
  const provider = PROVIDERS[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/register");
    }
  }, [authLoading, isAuthenticated, router]);

  // Subscription guard
  useEffect(() => {
    if (!authLoading && !subLoading && isAuthenticated && !isSubscribed) {
      router.push(`/subscribe?${searchParams.toString()}`);
    }
  }, [authLoading, subLoading, isAuthenticated, isSubscribed, searchParams, router]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated || !isSubscribed) return null;

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
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Severity Result */}
          <Card className={`border-2 ${config.borderColor} ${config.bgColor}`}>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Your Assessment Results</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className={`text-5xl font-bold ${config.color}`}>
                {config.label}
              </div>
              <p className="text-gray-700 max-w-lg mx-auto">{config.description}</p>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-4">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-2xl font-bold text-gray-900">{totalScore}/40</div>
                  <div className="text-xs text-gray-500">Total Score</div>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-2xl font-bold text-gray-900">{deq5Score}/18</div>
                  <div className="text-xs text-gray-500">DEQ-5 Score</div>
                </div>
              </div>

              {/* Risk Factors */}
              {riskFactorCount > 0 && (
                <div className="bg-white rounded-lg p-4 border text-left max-w-md mx-auto">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Risk Factors Identified
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {hasAutoimmune && <li>Autoimmune condition</li>}
                    {hasDiabetes && <li>Diabetes</li>}
                    {hasMGD && <li>Meibomian gland dysfunction (MGD) indicators</li>}
                    {hasTriedTreatments && <li>Prior treatments tried without full relief</li>}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MGD Info */}
          {hasMGD && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-amber-800">{MGD_INFO.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">{MGD_INFO.description}</p>
                <ul className="grid grid-cols-2 gap-2">
                  {MGD_INFO.symptoms.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Product Recommendations */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recommended Products for {config.label} Dry Eye
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendedProducts.map((product) => (
                <Card key={product.id} className="hover:border-primary-300 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                          {product.badge && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{product.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">${product.price.toFixed(2)}</span>
                          {product.compareAtPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              ${product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => addItem(product)}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-3 text-center">
              <Link href="/shop">
                <Button variant="ghost" size="sm">
                  Browse All Products <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Prescription Suggestions (moderate+) */}
          {(severity === "moderate" || severity === "severe") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prescription Treatments to Discuss</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  These prescription treatments may be beneficial for your condition. Discuss with your ophthalmologist.
                </p>
                <div className="space-y-3">
                  {PRESCRIPTION_TREATMENTS.map((rx, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{rx.name}</h4>
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          {rx.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{rx.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Procedural Treatments (severe only) */}
          {severity === "severe" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Procedural Treatments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  For severe dry eye, these in-office procedures can provide significant relief.
                </p>
                <div className="space-y-3">
                  {PROCEDURAL_TREATMENTS.map((proc, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{proc.name}</h4>
                      <p className="text-xs text-gray-600 mb-1">{proc.description}</p>
                      <p className="text-xs text-primary-600 italic">{proc.clinicalNote}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Book Consultation CTA */}
          <Card className="border-primary-300 bg-primary-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <User className="h-7 w-7 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    Book a Specialist Consultation
                  </h3>
                  <p className="text-sm text-gray-700 mb-1">
                    {provider.name}, {provider.credentials}
                  </p>
                  <p className="text-xs text-gray-500 mb-1">
                    {provider.specialty} &mdash; {provider.subspecialty}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    {provider.location} &bull; {provider.phone}
                  </p>
                  <div className="flex items-center gap-3">
                    <Link href="/booking">
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Consultation
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="secondary">
                        Return to Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Recommendations based on TFOS DEWS II clinical guidelines</span>
          </div>
        </div>
      </main>
    </div>
  );
}
