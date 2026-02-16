"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ArrowLeft, Loader2, Activity } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSymptomHistory } from "@/lib/symptom-history-context";
import { TrendChart } from "@/components/symptom-history-widget";
import { Severity } from "@/lib/assessment-utils";

const severityBadge: Record<Severity, { label: string; className: string }> = {
  mild: { label: "Mild", className: "bg-green-100 text-green-700" },
  moderate: { label: "Moderate", className: "bg-amber-100 text-amber-700" },
  severe: { label: "Severe", className: "bg-red-100 text-red-700" },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SymptomTrackerPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { history, isLoading: historyLoading } = useSymptomHistory();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const sortedHistory = [...history].reverse();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Symptom Tracker</h1>
              <p className="text-gray-600">Track your dry eye symptoms over time</p>
            </div>
            <Link href="/assessment">
              <Button>
                <Activity className="h-4 w-4 mr-2" />
                {history.length > 0 ? "Retake Assessment" : "Take Assessment"}
              </Button>
            </Link>
          </div>

          {history.length === 0 ? (
            <Card className="border-primary-200 bg-primary-50">
              <CardContent className="py-12 text-center">
                <Eye className="h-12 w-12 text-primary-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No assessments yet</h3>
                <p className="text-gray-500 mb-4">
                  Complete your first dry eye assessment to start tracking your symptoms.
                </p>
                <Link href="/assessment">
                  <Button>Take Your First Assessment</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Trend Chart */}
              {history.length >= 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Symptom Score Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <TrendChart entries={history} />
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
                        Mild (0-15)
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                        Moderate (15-28)
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                        Severe (28+)
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assessment History Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assessment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 font-medium text-gray-500">Date</th>
                          <th className="pb-3 font-medium text-gray-500">Score</th>
                          <th className="pb-3 font-medium text-gray-500">DEQ-5</th>
                          <th className="pb-3 font-medium text-gray-500">Severity</th>
                          <th className="pb-3 font-medium text-gray-500">Risk Factors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedHistory.map((result) => {
                          const badge = severityBadge[result.severity];
                          const risks = [
                            result.autoimmune && "Autoimmune",
                            result.diabetes && "Diabetes",
                            result.mgd && "MGD",
                          ].filter(Boolean);
                          return (
                            <tr key={result.id} className="border-b last:border-0">
                              <td className="py-3 text-gray-900">
                                {formatDateTime(result.timestamp)}
                              </td>
                              <td className="py-3 font-medium text-gray-900">
                                {result.score}/40
                              </td>
                              <td className="py-3 text-gray-600">
                                {result.deq5}/18
                              </td>
                              <td className="py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.className}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="py-3 text-gray-600">
                                {risks.length > 0 ? risks.join(", ") : "None"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
