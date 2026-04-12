// src/app/patient/results/page.tsx
"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Eye, Calendar, ShoppingCart, Lock, ArrowRight, Loader2,
  Shield, AlertTriangle, CheckCircle2, RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/lib/subscription-context"
import { useCart } from "@/lib/cart-context"
import { getPathway, Severity, RiskTier } from "@/lib/assessment-utils"
import { PRODUCTS } from "@/lib/constants"

interface AssessmentResult {
  id: string
  timestamp: string
  severity: Severity
  riskTier: RiskTier
  frequencyScore: number
  intensityScore: number
  frequencySeverity: string
  intensitySeverity: string
  riskFactorCount: number
  priorTreatment: boolean
  ocularConditions: string[]
  medicalConditions: string[]
  pastFailedTreatments: string[]
  currentTreatments: string[]
  symptomFrequencies: Record<string, number>
  symptomIntensities: Record<string, number>
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bgColor: string; borderColor: string; description: string }> = {
  mild: {
    label: "Mild", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200",
    description: "Your symptoms suggest mild dry eye. Simple lifestyle changes and over-the-counter treatments can provide significant relief.",
  },
  moderate: {
    label: "Moderate", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200",
    description: "Your symptoms suggest moderate dry eye. A combination of OTC products and prescription treatments may be recommended.",
  },
  severe: {
    label: "Severe", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200",
    description: "Your symptoms suggest severe dry eye requiring comprehensive treatment. A specialist consultation is strongly recommended.",
  },
}

// Map severity to recommended product IDs from the PRODUCTS catalogue
const SEVERITY_PRODUCT_IDS: Record<Severity, string[]> = {
  mild: ["systane-ultra-pf", "systane-lid-wipes", "nordic-naturals-omega"],
  moderate: ["refresh-optive-mega3", "bruder-mask", "ocusoft-lid-scrub"],
  severe: ["genteal-gel-nighttime", "bruder-mask", "prn-omega-3"],
}

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const { addItem } = useCart()

  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const assessmentId = searchParams.get("id")

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login?from=/patient/results"); return }

    fetch("/api/assessments")
      .then(r => r.json())
      .then(data => {
        const history: AssessmentResult[] = data.history ?? []
        const target = assessmentId
          ? history.find(h => h.id === assessmentId)
          : history[0]
        if (target) setResult(target)
        else setError("Assessment not found. Please complete an assessment first.")
      })
      .catch(() => setError("Failed to load results. Please try again."))
      .finally(() => setLoading(false))
  }, [user, authLoading, assessmentId, router])

  if (authLoading || subLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-700 mb-4">{error}</p>
            <Link href="/patient/assessment" className={buttonVariants()}>Take Assessment</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!result) return null

  const severityConfig = SEVERITY_CONFIG[result.severity]
  const pathway = getPathway(result.severity, result.priorTreatment)

  // ── Soft gate: show teaser if not subscribed ──────────────────────────────
  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <header className="container mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
          </Link>
        </header>
        <main className="container mx-auto px-4 pb-20 max-w-2xl">
          <div className="text-center mb-8">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Assessment Is Complete</h1>
            <p className="text-gray-600">Subscribe to unlock your full results, personalized treatment plan, and provider booking.</p>
          </div>

          {/* Blurred teaser */}
          <div className="relative mb-8">
            <div className="filter blur-sm pointer-events-none select-none">
              <Card className={`border-2 ${severityConfig.borderColor} ${severityConfig.bgColor}`}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-gray-300 mb-2">██</div>
                    <p className="text-gray-400">Severity Score</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-white rounded p-3"><div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" /></div>
                      <div className="bg-white rounded p-3"><div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
              <div className="text-center">
                <Lock className="h-10 w-10 text-primary-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Subscribe to unlock</p>
              </div>
            </div>
          </div>

          <Card className="border-primary-200">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What you&apos;ll unlock</h2>
              <ul className="space-y-3 mb-6">
                {[
                  "Your full dry eye severity score and risk tier",
                  "Personalized treatment recommendations",
                  "Prescription and procedural treatment guidance",
                  "Book a video consultation with an ophthalmologist",
                  "Symptom tracking over time",
                  "Access to the KlaraMD product shop",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push(`/subscribe?return=/patient/results${assessmentId ? `?id=${assessmentId}` : ""}`)}
              >
                Subscribe to See Your Results
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">$129/month for 3 months, then $59/month</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ── Full results (subscribed) ─────────────────────────────────────────────
  // pathway.firstLine is string[] — map to treatment objects for rendering
  const treatments = pathway.firstLine.map(name => ({ name }))

  const recommendedProductIds = SEVERITY_PRODUCT_IDS[result.severity]
  const recommendedProducts = PRODUCTS.filter(p =>
    recommendedProductIds.includes(p.id)
  ).slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
          </Link>
          <Link href="/patient/dashboard" className="text-sm text-primary-600 hover:underline">Dashboard →</Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20 max-w-3xl">
        {/* Severity banner */}
        <Card className={`mb-6 border-2 ${severityConfig.borderColor} ${severityConfig.bgColor}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Your Dry Eye Severity</p>
                <h1 className={`text-4xl font-bold ${severityConfig.color}`}>{severityConfig.label}</h1>
                <p className="text-gray-700 mt-2 max-w-md">{severityConfig.description}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm text-gray-500">Frequency: <span className="font-semibold text-gray-900">{result.frequencyScore}/24</span></div>
                <div className="text-sm text-gray-500">Intensity: <span className="font-semibold text-gray-900">{result.intensityScore}/60</span></div>
                <div className="text-sm text-gray-500">Risk Tier: <span className="font-semibold text-gray-900 capitalize">{result.riskTier}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment recommendations */}
        {treatments.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Recommended Treatments</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {treatments.map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <div>
                      <p className="font-medium text-gray-900">{t.name}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Product recommendations */}
        {recommendedProducts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recommended Products</CardTitle>
                <Link href="/patient/shop" className="text-sm text-primary-600 hover:underline">View all →</Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {recommendedProducts.map(product => (
                  <div key={product.id} className="border rounded-lg p-3">
                    <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">${product.price}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => { addItem(product); router.push("/patient/shop/cart") }}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" /> Add to Cart
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Book consultation CTA */}
        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-10 w-10 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 mb-1">Book a Video Consultation</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Speak with a board-certified ophthalmologist who will review your assessment and create a personalized care plan.
                </p>
                <Link href={`/patient/booking${assessmentId ? `?assessmentId=${assessmentId}` : ""}`} className={buttonVariants()}>
                  Book Appointment <Calendar className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link href="/patient/assessment" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <RefreshCw className="h-4 w-4 mr-1" /> Retake Assessment
          </Link>
        </div>
      </main>
    </div>
  )
}

export default function PatientResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>}>
      <ResultsContent />
    </Suspense>
  )
}
