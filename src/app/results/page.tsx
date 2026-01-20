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
    title: "Mild Dry Eye Symptoms",
    description:
      "Your symptoms suggest mild dry eye. The good news is that many people find relief with simple self-care measures and over-the-counter treatments.",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle,
    recommendation:
      "We recommend starting with over-the-counter treatments. Monitor your symptoms and return if they persist or worsen.",
    showBooking: false,
    bookingUrgency: "",
  },
  moderate: {
    level: "moderate",
    title: "Moderate Dry Eye Symptoms",
    description:
      "Your symptoms indicate moderate dry eye disease. While self-care can help, you may benefit from professional guidance to find the most effective treatment plan.",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: AlertTriangle,
    recommendation:
      "We recommend trying over-the-counter treatments first. If symptoms don't improve in 2-4 weeks, consider booking a consultation.",
    showBooking: true,
    bookingUrgency: "Consider a consultation if symptoms persist",
  },
  severe: {
    level: "severe",
    title: "Significant Dry Eye Symptoms",
    description:
      "Your symptoms suggest more significant dry eye disease that would benefit from professional evaluation. Prescription treatments may provide better relief than over-the-counter options alone.",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: AlertCircle,
    recommendation:
      "We strongly recommend booking a consultation with one of our eye care specialists to discuss prescription treatment options.",
    showBooking: true,
    bookingUrgency: "Consultation recommended",
  },
};

function getSeverity(score: number): Severity {
  if (score <= 6) return "mild";
  if (score <= 14) return "moderate";
  return "severe";
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const score = parseInt(searchParams.get("score") || "0", 10);
  const severity = getSeverity(score);
  const config = severityConfigs[severity];
  const Icon = config.icon;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Assessment Results
        </h1>
        <p className="text-gray-600">
          Based on your responses, here&apos;s what we found
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
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Score:</span>
                <span className={`font-bold ${config.color}`}>{score}/24</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            Our Recommendation
          </h3>
          <p className="text-gray-700">{config.recommendation}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Link href="/recommendations" className="block">
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
              className="w-full justify-between"
              variant={severity === "severe" ? "default" : "secondary"}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Book a Consultation
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
              Still want to talk to a specialist?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Even with mild symptoms, some patients prefer professional guidance.
              You can always book a consultation if you&apos;d like personalized advice.
            </p>
            <Link href="/register">
              <Button variant="secondary" size="sm">
                Book Optional Consultation
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-gray-500 mt-8">
        This assessment is for informational purposes only and does not constitute
        a medical diagnosis. For severe or persistent symptoms, please consult
        a healthcare provider.
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
            <span className="text-xl font-semibold text-primary-900">EyeCare</span>
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
