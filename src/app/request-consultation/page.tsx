"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye, ArrowRight, Loader2, Calendar, Sun, Sunset, CheckCircle,
} from "lucide-react";
import Link from "next/link";

// Block definitions — times stored as UTC offsets for Ontario (EST = UTC-5)
const BLOCKS = [
  { key: "morning",   label: "Morning",   time: "9:00 AM – 12:00 PM", fromHour: 14, toHour: 17, icon: Sun },
  { key: "afternoon", label: "Afternoon", time: "1:00 PM – 5:00 PM",  fromHour: 18, toHour: 22, icon: Sunset },
] as const;

type BlockKey = typeof BLOCKS[number]["key"];

function generateWeekdays(count = 14): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 1; dates.length < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(d);
  }
  return dates;
}

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function buildAvailability(selected: Record<string, Set<BlockKey>>) {
  const blocks: { available_from: string; available_until: string }[] = [];
  for (const [dateKey, blockSet] of Object.entries(selected)) {
    for (const blockKey of Array.from(blockSet)) {
      const block = BLOCKS.find((b) => b.key === blockKey)!;
      blocks.push({
        available_from: `${dateKey}T${String(block.fromHour).padStart(2, "0")}:00:00Z`,
        available_until: `${dateKey}T${String(block.toHour).padStart(2, "0")}:00:00Z`,
      });
    }
  }
  return blocks;
}

function RequestConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const assessmentId = searchParams.get("assessment_id");

  const [selected, setSelected] = useState<Record<string, Set<BlockKey>>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const dates = generateWeekdays(14);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  const toggleBlock = (dateKey: string, block: BlockKey) => {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[dateKey] ?? []);
      if (set.has(block)) {
        set.delete(block);
      } else {
        set.add(block);
      }
      if (set.size === 0) {
        delete next[dateKey];
      } else {
        next[dateKey] = set;
      }
      return next;
    });
  };

  const totalSelected = Object.values(selected).reduce((sum, s) => sum + s.size, 0);

  const handleSubmit = async () => {
    if (totalSelected === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/consultation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_result_id: assessmentId ?? undefined,
          patient_notes: notes.trim() || undefined,
          availability: buildAvailability(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Request Submitted</h1>
          <p className="text-gray-600 mb-8">
            A specialist will review your availability and confirm your appointment. You&apos;ll see it in your dashboard once booked.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="w-full">
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
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
          <Link href="/dashboard" className="text-sm text-primary-700 hover:text-primary-800">
            Back to Dashboard
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              When Are You Available?
            </h1>
            <p className="text-gray-600">
              Select the time blocks that work for you. A specialist will confirm your appointment based on their schedule.
            </p>
            {assessmentId && (
              <div className="inline-flex items-center gap-2 mt-4 bg-primary-50 border border-primary-200 text-primary-700 text-sm px-4 py-2 rounded-full">
                <CheckCircle className="h-4 w-4" />
                Assessment results will be shared with your specialist
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary-600" />
                Select Your Available Times
              </CardTitle>
              <p className="text-sm text-gray-500">All times in Eastern Time (EST)</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-sm font-medium text-gray-500 pb-3 pr-4 min-w-[110px]">Date</th>
                      {BLOCKS.map((block) => (
                        <th key={block.key} className="text-center text-sm font-medium text-gray-500 pb-3 px-2 min-w-[140px]">
                          <div className="flex flex-col items-center gap-1">
                            <block.icon className="h-4 w-4" />
                            <span>{block.label}</span>
                            <span className="text-xs font-normal text-gray-400">{block.time}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dates.map((date) => {
                      const dateKey = toDateKey(date);
                      const dayLabel = date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
                      return (
                        <tr key={dateKey} className="hover:bg-gray-50">
                          <td className="py-3 pr-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                            {dayLabel}
                          </td>
                          {BLOCKS.map((block) => {
                            const isSelected = selected[dateKey]?.has(block.key) ?? false;
                            return (
                              <td key={block.key} className="py-3 px-2 text-center">
                                <button
                                  onClick={() => toggleBlock(dateKey, block.key)}
                                  className={`w-full py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                    isSelected
                                      ? "border-primary-600 bg-primary-600 text-white"
                                      : "border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700"
                                  }`}
                                >
                                  {isSelected ? "✓ Selected" : "Available"}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Additional Notes for Your Specialist</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your main concerns, current symptoms, or anything you'd like the specialist to know before your consultation..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              {totalSelected === 0
                ? "Select at least one time block to continue"
                : `${totalSelected} time block${totalSelected > 1 ? "s" : ""} selected`}
            </p>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={totalSelected === 0 || submitting}
              className="min-w-[200px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Request Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RequestConsultationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <RequestConsultationContent />
    </Suspense>
  );
}
