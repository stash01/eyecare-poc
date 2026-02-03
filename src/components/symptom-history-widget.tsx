"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import { useSymptomHistory, AssessmentResult } from "@/lib/symptom-history-context";
import { Severity } from "@/lib/assessment-utils";

const severityBadge: Record<Severity, { label: string; className: string }> = {
  mild: { label: "Mild", className: "bg-green-100 text-green-700" },
  moderate: { label: "Moderate", className: "bg-amber-100 text-amber-700" },
  severe: { label: "Severe", className: "bg-red-100 text-red-700" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TrendChart({ entries }: { entries: AssessmentResult[] }) {
  const recent = entries.slice(-10);
  const W = 400;
  const H = 120;
  const PAD_X = 36;
  const PAD_TOP = 8;
  const PAD_BOTTOM = 20;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_TOP - PAD_BOTTOM;
  const maxY = 40;

  const toX = (i: number) =>
    PAD_X + (recent.length === 1 ? chartW / 2 : (i / (recent.length - 1)) * chartW);
  const toY = (score: number) =>
    PAD_TOP + chartH - (score / maxY) * chartH;

  const points = recent.map((e, i) => `${toX(i)},${toY(e.score)}`).join(" ");

  // Area fill path
  const areaPath =
    `M ${toX(0)},${toY(recent[0].score)} ` +
    recent.map((e, i) => `L ${toX(i)},${toY(e.score)}`).join(" ") +
    ` L ${toX(recent.length - 1)},${PAD_TOP + chartH} L ${toX(0)},${PAD_TOP + chartH} Z`;

  // Threshold lines
  const mildY = toY(15);
  const modY = toY(28);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Symptom score trend chart">
      {/* Threshold bands */}
      <rect x={PAD_X} y={PAD_TOP} width={chartW} height={modY - PAD_TOP} fill="#fef2f2" opacity="0.5" />
      <rect x={PAD_X} y={modY} width={chartW} height={mildY - modY} fill="#fffbeb" opacity="0.5" />
      <rect x={PAD_X} y={mildY} width={chartW} height={PAD_TOP + chartH - mildY} fill="#f0fdf4" opacity="0.5" />

      {/* Threshold lines */}
      <line x1={PAD_X} y1={mildY} x2={W - PAD_X} y2={mildY} stroke="#d1d5db" strokeDasharray="4 2" strokeWidth="1" />
      <line x1={PAD_X} y1={modY} x2={W - PAD_X} y2={modY} stroke="#d1d5db" strokeDasharray="4 2" strokeWidth="1" />

      {/* Threshold labels */}
      <text x={PAD_X - 4} y={mildY + 3} textAnchor="end" fontSize="8" fill="#9ca3af">15</text>
      <text x={PAD_X - 4} y={modY + 3} textAnchor="end" fontSize="8" fill="#9ca3af">28</text>

      {/* Area fill */}
      <path d={areaPath} fill="#3b82f6" opacity="0.1" />

      {/* Line */}
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points */}
      {recent.map((e, i) => (
        <circle key={e.id} cx={toX(i)} cy={toY(e.score)} r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
      ))}

      {/* X-axis date labels */}
      {recent.map((e, i) => {
        // Show first, last, and every other label to avoid crowding
        if (recent.length > 4 && i !== 0 && i !== recent.length - 1 && i % 2 !== 0) return null;
        return (
          <text key={`label-${e.id}`} x={toX(i)} y={H - 2} textAnchor="middle" fontSize="8" fill="#9ca3af">
            {formatDate(e.timestamp)}
          </text>
        );
      })}
    </svg>
  );
}

function TrendIndicator({ entries }: { entries: AssessmentResult[] }) {
  if (entries.length < 2) return null;
  const prev = entries[entries.length - 2].score;
  const curr = entries[entries.length - 1].score;
  const diff = curr - prev;

  if (diff < 0) {
    return (
      <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
        <TrendingDown className="h-4 w-4" />
        <span>{Math.abs(diff)} pts lower (improving)</span>
      </div>
    );
  }
  if (diff > 0) {
    return (
      <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
        <TrendingUp className="h-4 w-4" />
        <span>{diff} pts higher (worsening)</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-gray-500 text-sm font-medium">
      <Minus className="h-4 w-4" />
      <span>Stable</span>
    </div>
  );
}

export function SymptomHistoryWidget() {
  const { history, latestResult, isLoading } = useSymptomHistory();

  if (isLoading) return null;

  // No data state
  if (!latestResult) {
    return (
      <Card className="border-primary-200 bg-primary-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Track Your Dry Eye Symptoms</div>
              <p className="text-sm text-gray-500">
                Complete an assessment to start tracking your symptoms over time.
              </p>
            </div>
            <Link href="/assessment">
              <Button size="sm">Take Assessment</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const badge = severityBadge[latestResult.severity];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Symptom Tracker</span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${badge.className}`}>
            {badge.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Latest result summary */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Latest score: <span className="font-semibold text-gray-900">{latestResult.score}/40</span>
              <span className="text-gray-400 ml-2">(DEQ-5: {latestResult.deq5}/18)</span>
            </div>
            <div className="text-gray-400 text-xs">{formatDate(latestResult.timestamp)}</div>
          </div>

          <TrendIndicator entries={history} />

          {/* Chart or retake message */}
          {history.length >= 2 ? (
            <div className="border rounded-lg p-2 bg-gray-50">
              <TrendChart entries={history} />
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              Retake the assessment in a few weeks to see your trend over time.
            </p>
          )}

          <div className="pt-1">
            <Link href="/assessment">
              <Button variant="secondary" size="sm" className="w-full">
                Retake Assessment
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
