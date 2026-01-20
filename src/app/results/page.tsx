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
      "Living with moderate dry eye can really affect your quality of life, and we want you to know that relief is absolutely possible. While self-care helps many people, you may also benefit from personalized guidance from a specialist who can create a treatment plan just for you.",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: AlertTriangle,
    recommendation:
      "Let's start with some proven over-the-counter options. If you don't see improvement in a couple of weeks, connecting with one of our caring specialists could help you find faster relief.",
    showBooking: true,
    bookingUrgency: "We're here when you're ready",
  },
  severe: {
    level: "severe",
    title: "You Deserve Better Than This",
    description:
      "We know how much you've been struggling — significant dry eye symptoms can be exhausting and really impact your daily life. Please know that you don't have to keep dealing with this alone. With the right treatment plan, many people experience meaningful relief.",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: AlertCircle,
    recommendation:
      "Based on what you've shared, we'd love to connect you with one of our compassionate eye care specialists. They can discuss prescription options that may give you the relief you've been looking for.",
    showBooking: true,
    bookingUrgency: "Let's get you help",
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
            Your Path Forward
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
            <span>See What Can Help You Feel Better</span>
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
                Talk to a Specialist
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
              Our specialists are here whenever you're ready — no pressure, just support.
            </p>
            <Link href="/register">
              <Button variant="secondary" size="sm">
                Connect with a Specialist
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
