import { NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// GET /api/admin/requests — all pending consultation requests across all providers (admin only)
export async function GET() {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: requests, error } = await db
    .from("consultation_requests")
    .select("id, status, patient_notes, assessment_result_id, patient_id, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  if (!requests || requests.length === 0) return NextResponse.json({ requests: [] });

  const requestIds = requests.map((r) => r.id);
  const patientIds = Array.from(new Set(requests.map((r) => r.patient_id)));
  const assessmentIds = requests.map((r) => r.assessment_result_id).filter(Boolean) as string[];

  const [{ data: patients }, { data: assessments }, { data: availability }] = await Promise.all([
    db
      .from("patients")
      .select("id, first_name, last_name, email")
      .in("id", patientIds),
    assessmentIds.length > 0
      ? db
          .from("assessment_results")
          .select("id, severity, frequency_score, intensity_score, risk_factor_count, risk_tier")
          .in("id", assessmentIds)
      : Promise.resolve({ data: [] }),
    db
      .from("patient_availability")
      .select("id, consultation_request_id, available_from, available_until")
      .in("consultation_request_id", requestIds)
      .order("available_from"),
  ]);

  const patientMap = Object.fromEntries((patients ?? []).map((p) => [p.id, p]));
  const assessmentMap = Object.fromEntries((assessments ?? []).map((a) => [a.id, a]));
  const availabilityByRequest = (availability ?? []).reduce<
    Record<string, { id: string; available_from: string; available_until: string }[]>
  >((acc, row) => {
    if (!acc[row.consultation_request_id]) acc[row.consultation_request_id] = [];
    acc[row.consultation_request_id].push({
      id: row.id,
      available_from: row.available_from,
      available_until: row.available_until,
    });
    return acc;
  }, {});

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      status: r.status,
      patient_notes: r.patient_notes,
      created_at: r.created_at,
      patient: patientMap[r.patient_id] ?? null,
      assessment: r.assessment_result_id ? (assessmentMap[r.assessment_result_id] ?? null) : null,
      availability: availabilityByRequest[r.id] ?? [],
    })),
  });
}
