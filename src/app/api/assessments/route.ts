import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/server/request";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

// GET /api/assessments
export async function GET(req: NextRequest) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: results, error } = await db
    .from("assessment_results")
    .select(
      "id, total_score, severity, has_autoimmune, has_diabetes, tried_treatments, created_at, raw_answers, frequency_score, intensity_score, risk_factor_count, risk_tier, frequency_severity, intensity_severity"
    )
    .eq("patient_id", session.patientId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }

  await logAuditEvent(
    "patient",
    session.patientId,
    "list_assessments",
    "assessment_results",
    null,
    getClientIp(req)
  );

  const history = (results ?? []).map((r) => {
    const raw = (r.raw_answers ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      timestamp: r.created_at,
      frequencyScore: r.frequency_score ?? (r.total_score ?? 0),
      intensityScore: r.intensity_score ?? 0,
      frequencySeverity: r.frequency_severity ?? r.severity ?? "mild",
      intensitySeverity: r.intensity_severity ?? r.severity ?? "mild",
      riskFactorCount: r.risk_factor_count ?? 0,
      riskTier: r.risk_tier ?? "low",
      severity: r.severity ?? "mild",
      priorTreatment: r.tried_treatments ?? false,
      symptomFrequencies: (raw.symptomFrequencies as Record<string, number>) ?? {},
      symptomIntensities: (raw.symptomIntensities as Record<string, number>) ?? {},
      ocularConditions: (raw.ocularConditions as string[]) ?? [],
      medicalConditions: (raw.medicalConditions as string[]) ?? [],
      pastFailedTreatments: (raw.pastFailedTreatments as string[]) ?? [],
      currentTreatments: (raw.currentTreatments as string[]) ?? [],
      rawAnswers: raw,
    };
  });

  return NextResponse.json({ history });
}

// POST /api/assessments
export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      frequencyScore,
      intensityScore,
      frequencySeverity,
      intensitySeverity,
      riskFactorCount,
      riskTier,
      severity,
      priorTreatment,
      medicalConditions = [],
      ocularConditions = [],
      pastFailedTreatments = [],
      currentTreatments = [],
      symptomFrequencies = {},
      symptomIntensities = {},
      rawAnswers,
    } = body;

    if (frequencyScore === undefined || intensityScore === undefined || !severity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: result, error: insertError } = await db
      .from("assessment_results")
      .insert({
        patient_id: session.patientId,
        total_score: (frequencyScore ?? 0) + (intensityScore ?? 0),
        deq5_score: frequencyScore ?? 0,
        deq5_positive: (frequencyScore ?? 0) >= 6,
        severity,
        has_autoimmune: medicalConditions.includes("autoimmune"),
        has_diabetes: medicalConditions.includes("diabetes"),
        has_mgd: ocularConditions.includes("dry_eye_disease"),
        tried_treatments: priorTreatment ?? false,
        frequency_score: frequencyScore ?? null,
        intensity_score: intensityScore ?? null,
        risk_factor_count: riskFactorCount ?? null,
        risk_tier: riskTier ?? null,
        frequency_severity: frequencySeverity ?? null,
        intensity_severity: intensitySeverity ?? null,
        raw_answers: rawAnswers ?? {
          symptomFrequencies,
          symptomIntensities,
          ocularConditions,
          medicalConditions,
          pastFailedTreatments,
          currentTreatments,
        },
      })
      .select("id, created_at")
      .single();

    if (insertError || !result) {
      console.error("[assessments] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
    }

    await logAuditEvent(
      "patient",
      session.patientId,
      "create_assessment",
      "assessment_results",
      result.id,
      getClientIp(req)
    );

    return NextResponse.json({
      assessment: {
        id: result.id,
        timestamp: result.created_at,
      },
    });
  } catch (err) {
    console.error("[assessments] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
