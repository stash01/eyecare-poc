"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Calendar,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type Severity = "mild" | "moderate" | "severe";

interface SeverityConfig {
  level: Severity;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  recommendation: string;
  showBooking: boolean;
  bookingUrgency: string;
}

const severityConfigs: Record<Severity, SeverityConfig> = {
  mild: {
    level: "mild",
    title: "Good News — Your Symptoms are Mild",
    description:
      "We hear you — even mild discomfort can be frustrating. The good news is that many people in your situation find real relief with simple self-care steps and over-the-counter treatments. You've taken an important first step by learning more about what's happening.",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle,
    recommendation:
      "We've put together some gentle, effective treatments you can start today. Keep track of how you're feeling — and remember, we're here if things change.",
    showBooking: false,
    bookingUrgency: "",
  },
  moderate: {
    level: "moderate",
    title: "We Understand — These Symptoms Can Be Tough",
    description:
      "Living with moderate dry eye can really affect your quality of life, and we want you to know that relief is absolutely possible. While self-care helps many people, you may also benefit from personalized guidance from one of our board-certified ophthalmologists who can create a treatment plan just for you.",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: AlertTriangle,
    recommendation:
      "Let's start with some proven over-the-counter options. If you don't see improvement in a couple of weeks, connecting with one of our fellowship-trained ophthalmologists could help you find faster relief.",
    showBooking: true,
    bookingUrgency: "Talk to an Ophthalmologist",
  },
  severe: {
    level: "severe",
    title: "You Deserve Better Than This",
    description:
      "We know how much you've been struggling — significant dry eye symptoms can be exhausting and really impact your daily life. Please know that you don't have to keep dealing with this alone. With the right treatment plan from a board-certified ophthalmologist, many people experience meaningful relief.",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: AlertCircle,
    recommendation:
      "Based on what you've shared, we strongly recommend connecting with one of our fellowship-trained ophthalmologists. They can discuss prescription and procedural options that may give you the relief you've been looking for.",
    showBooking: true,
    bookingUrgency: "Schedule Ophthalmologist Consultation",
  },
};

function getSeverity(
  totalScore: number,
  deq5Score: number,
  deq5Positive: boolean,
  riskFactorCount: number
): Severity {
  // DEWS3-based severity using DEQ-5 clinical thresholds
  // DEQ-5 score ≥6 is diagnostic cutoff for dry eye (per TFOS DEWS II)
  // DEQ-5 max score: 18, Total max score: ~40

  let baseSeverity: Severity;

  // Primary classification based on DEQ-5 (clinically validated)
  if (!deq5Positive || deq5Score < 6) {
    baseSeverity = "mild";
  } else if (deq5Score < 12) {
    baseSeverity = "moderate";
  } else {
    baseSeverity = "severe";
  }

  // Secondary adjustment based on total symptom burden
  // If high total score despite lower DEQ-5, upgrade
  if (baseSeverity === "mild" && totalScore >= 15) {
    baseSeverity = "moderate";
  }
  if (baseSeverity === "moderate" && totalScore >= 28) {
    baseSeverity = "severe";
  }

  // Risk factor upgrade logic
  // 2+ risk factors: mild -> moderate
  // 3+ risk factors: moderate -> severe
  if (baseSeverity === "mild" && riskFactorCount >= 2) {
    return "moderate";
  }
  if (baseSeverity === "moderate" && riskFactorCount >= 3) {
    return "severe";
  }

  return baseSeverity;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const totalScore = parseInt(searchParams.get("score") || "0", 10);
  const deq5Score = parseInt(searchParams.get("deq5") || "0", 10);
  const deq5Positive = searchParams.get("deq5Positive") === "true";

  // Parse risk factor flags
  const hasAutoimmune = searchParams.get("autoimmune") === "true";
  const hasDiabetes = searchParams.get("diabetes") === "true";
  const hasTriedTreatments = searchParams.get("triedTreatments") === "true";
  const hasMGD = searchParams.get("mgd") === "true";

  // Count risk factors
  const riskFactorCount = [hasAutoimmune, hasDiabetes, hasTriedTreatments, hasMGD].filter(Boolean).length;

  const severity = getSeverity(totalScore, deq5Score, deq5Positive, riskFactorCount);
  const config = severityConfigs[severity];
  const Icon = config.icon;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Thank You for Sharing
        </h1>
        <p className="text-gray-600">
          We've carefully reviewed your responses — here's what we found and how we can help
        </p>
      </div>

      <Card className={`border-2 ${config.borderColor} ${config.bgColor} mb-8`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}
            >
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${config.color} mb-2`}>
                {config.title}
              </h2>
              <p className="text-gray-700 mb-4">{config.description}</p>
              <div className="flex flex-col gap-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">DEQ-5 Score:</span>
                  <span className={`font-bold ${config.color}`}>{deq5Score}/18</span>
                  {deq5Positive && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      Above clinical threshold
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Total symptom score: {totalScore}</span>
                  {riskFactorCount > 0 && (
                    <span>• {riskFactorCount} risk factor{riskFactorCount > 1 ? "s" : ""} identified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            Your Path Forward
          </h3>
          <p className="text-gray-700">{config.recommendation}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Link href={`/recommendations?severity=${severity}&score=${totalScore}&deq5=${deq5Score}&mgd=${hasMGD}`} className="block">
          <Button
            size="lg"
            className="w-full justify-between"
            variant={severity === "severe" ? "secondary" : "default"}
          >
            <span>See What Can Help You Feel Better</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>

        {config.showBooking && (
          <Link href="/register" className="block">
            <Button
              size="lg"
              className={`w-full justify-between ${severity === "severe" ? "bg-red-600 hover:bg-red-700" : ""}`}
              variant={severity === "severe" ? "default" : "secondary"}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {severity === "severe" ? "Schedule Ophthalmologist Consultation" : "Talk to an Ophthalmologist"}
              </span>
              <span className="text-sm opacity-80">{config.bookingUrgency}</span>
            </Button>
          </Link>
        )}

        <Link href="/assessment" className="block">
          <Button size="lg" variant="ghost" className="w-full">
            Retake Assessment
          </Button>
        </Link>
      </div>

      {severity === "mild" && (
        <Card className="mt-8 border-primary-200 bg-primary-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              We're here if you need us
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Even with mild symptoms, sometimes it helps to talk to someone who truly understands what you're experiencing.
              Our board-certified ophthalmologists are here whenever you're ready — no pressure, just support.
            </p>
            <Link href="/register">
              <Button variant="secondary" size="sm">
                Connect with an Ophthalmologist
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-gray-500 mt-8">
        This assessment helps us understand your experience but isn't a medical diagnosis.
        If your symptoms are severe or you're worried, please don't hesitate to reach out
        to a healthcare provider — your comfort and wellbeing matter.
      </p>
    </div>
  );
}

function ResultsLoading() {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading your results...</p>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">Klara</span>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <Suspense fallback={<ResultsLoading />}>
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  );
}
