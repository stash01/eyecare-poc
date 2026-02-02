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
    title: "Mild Symptoms Detected",
    description:
      "Your assessment indicates mild dry eye symptoms. Many patients with similar symptom profiles find relief through consistent self-care routines and over-the-counter treatments. This is an important step in understanding your condition.",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle,
    recommendation:
      "We recommend starting with evidence-based self-care strategies. Monitor your symptoms and reach out to our specialists if you notice any changes or lack of improvement.",
    showBooking: false,
    bookingUrgency: "",
  },
  moderate: {
    level: "moderate",
    title: "Moderate Symptoms Detected",
    description:
      "Your assessment indicates moderate dry eye disease, which can significantly impact quality of life. While self-care measures may provide some relief, patients with moderate symptoms often benefit from personalized treatment plans developed with a specialist.",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: AlertTriangle,
    recommendation:
      "We recommend beginning with over-the-counter treatments while considering a specialist consultation. If symptoms persist after 2-3 weeks of consistent treatment, connecting with one of our ophthalmologists can help identify more targeted interventions.",
    showBooking: true,
    bookingUrgency: "Consult a Specialist",
  },
  severe: {
    level: "severe",
    title: "Significant Symptoms Detected",
    description:
      "Your assessment indicates significant dry eye disease that may benefit from specialist intervention. Patients with similar symptom profiles often experience meaningful improvement with appropriate prescription treatments and clinical management.",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: AlertCircle,
    recommendation:
      "Based on your assessment results, we recommend scheduling a consultation with one of our fellowship-trained ophthalmologists. They can evaluate prescription treatments and procedural options tailored to your specific condition.",
    showBooking: true,
    bookingUrgency: "Schedule Specialist Consultation",
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
          Your Assessment Results
        </h1>
        <p className="text-gray-600">
          Based on clinically validated measures, here is your personalized assessment and recommended next steps
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
            Recommended Next Steps
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
            <span>View Treatment Recommendations</span>
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
              Specialist Support Available
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Even with mild symptoms, some patients benefit from specialist guidance.
              Our board-certified ophthalmologists are available for consultations if you would like personalized care.
            </p>
            <Link href="/booking">
              <Button variant="secondary" size="sm">
                Schedule a Consultation
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-gray-500 mt-8">
        This assessment provides guidance based on validated clinical measures but does not
        constitute a medical diagnosis. For severe symptoms or medical emergencies, please
        consult a healthcare provider directly.
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
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
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
