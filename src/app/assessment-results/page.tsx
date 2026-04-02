"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  ShoppingCart,
  Calendar,
  Loader2,
  Shield,
  ArrowRight,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/subscription-context";
import { useCart } from "@/lib/cart-context";
import { getPathway, Severity, RiskTier } from "@/lib/assessment-utils";
import { PRODUCTS, PROVIDERS, Product } from "@/lib/constants";

const SEVERITY_CONFIG: Record<
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
      "Your symptoms suggest moderate dry eye. A combination of OTC products and prescription treatments may be recommended.",
  },
  severe: {
    label: "Severe",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    description:
      "Your symptoms suggest severe dry eye requiring comprehensive treatment. A specialist consultation is strongly recommended.",
  },
};

const RISK_TIER_CONFIG: Record<
  RiskTier,
  { label: string; color: string; bgColor: string }
> = {
  low: { label: "Low", color: "text-green-700", bgColor: "bg-green-100" },
  moderate: { label: "Moderate", color: "text-amber-700", bgColor: "bg-amber-100" },
  high: { label: "High / Poor Response", color: "text-red-700", bgColor: "bg-red-100" },
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
  return [
    ...artificialTears.slice(0, 3),
    ...warmCompresses,
    ...lidCare.slice(0, 2),
    ...supplements.slice(0, 2),
  ];
}

export default function AssessmentResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
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

  const frequencyScore = parseInt(searchParams.get("frequencyScore") || "0");
  const intensityScore = parseInt(searchParams.get("intensityScore") || "0");
  const frequencySeverity = (searchParams.get("frequencySeverity") || "mild") as Severity;
  const intensitySeverity = (searchParams.get("intensitySeverity") || "mild") as Severity;
  const riskFactorCount = parseInt(searchParams.get("riskFactorCount") || "0");
  const riskTier = (searchParams.get("riskTier") || "low") as RiskTier;
  const severity = (searchParams.get("severity") || "mild") as Severity;
  const priorTreatment = searchParams.get("priorTreatment") === "true";

  const config = SEVERITY_CONFIG[severity];
  const riskConfig = RISK_TIER_CONFIG[riskTier];
  const pathway = getPathway(severity, priorTreatment);
  const recommendedProducts = getRecommendedProducts(severity);
  const provider = PROVIDERS[0];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/register");
  }, [authLoading, isAuthenticated, router]);

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

          {/* ── Severity & Score Summary ─────────────────────────────── */}
          <Card className={`border-2 ${config.borderColor} ${config.bgColor}`}>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Your Assessment Results</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className={`text-5xl font-bold ${config.color}`}>{config.label}</div>
              <p className="text-gray-700 max-w-lg mx-auto">{config.description}</p>

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-4">
                <div className="bg-white rounded-lg p-3 border text-center">
                  <div className="text-xl font-bold text-gray-900">{frequencyScore}<span className="text-sm font-normal text-gray-400">/24</span></div>
                  <div className="text-xs text-gray-500 mt-0.5">Frequency</div>
                  <div className={`text-xs font-medium mt-0.5 capitalize ${SEVERITY_CONFIG[frequencySeverity].color}`}>
                    {frequencySeverity}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border text-center">
                  <div className="text-xl font-bold text-gray-900">{intensityScore}<span className="text-sm font-normal text-gray-400">/60</span></div>
                  <div className="text-xs text-gray-500 mt-0.5">Intensity</div>
                  <div className={`text-xs font-medium mt-0.5 capitalize ${SEVERITY_CONFIG[intensitySeverity].color}`}>
                    {intensitySeverity}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border text-center">
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mt-1 ${riskConfig.bgColor} ${riskConfig.color}`}>
                    {riskConfig.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Risk Tier</div>
                  <div className="text-xs text-gray-400">{riskFactorCount} factor{riskFactorCount !== 1 ? "s" : ""}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Treatment Pathway ────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-600" />
                Your Recommended Pathway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Step 1: Review exacerbating causes */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Review of exacerbating causes and possible modifications</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your clinician will discuss environmental, lifestyle, and systemic factors that may be contributing to your symptoms.
                  </p>
                </div>
              </div>

              {/* Step 2: First-line treatments */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-2">
                    {priorTreatment ? "Prescription treatment recommendations" : "First-line treatment recommendations"}
                  </p>
                  <ul className="space-y-1.5">
                    {pathway.firstLine.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Step 3: Poor response escalation */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  <RefreshCw className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-2">
                    If poor response — consider
                  </p>
                  <ul className="space-y-1.5">
                    {pathway.poorResponse.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-gray-400 pt-2 border-t">
                Treatment recommendations are generated by KlaraMD clinical decision support and must
                be reviewed and confirmed by your treating ophthalmologist.
              </p>
            </CardContent>
          </Card>

          {/* ── Product Recommendations ──────────────────────────────── */}
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
                      <Button size="sm" variant="secondary" onClick={() => addItem(product)}>
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

          {/* ── Book Consultation CTA ─────────────────────────────────── */}
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
                    <Link href="/request-consultation">
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Request Consultation
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="secondary">Return to Dashboard</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Recommendations based on real clinical pathways</span>
          </div>
        </div>
      </main>
    </div>
  );
}
