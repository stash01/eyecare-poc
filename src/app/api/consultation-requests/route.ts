import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/server/request";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

// GET /api/consultation-requests — patient's own requests with availability
export async function GET() {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: requests, error } = await db
    .from("consultation_requests")
    .select("id, status, patient_notes, assessment_result_id, created_at")
    .eq("patient_id", session.patientId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });

  if (!requests || requests.length === 0) {
    return NextResponse.json({ requests: [] });
  }

  // Fetch availability blocks for all requests
  const requestIds = requests.map((r) => r.id);
  const { data: availability } = await db
    .from("patient_availability")
    .select("id, consultation_request_id, available_from, available_until")
    .in("consultation_request_id", requestIds)
    .order("available_from");

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
      ...r,
      availability: availabilityByRequest[r.id] ?? [],
    })),
  });
}

// POST /api/consultation-requests — patient submits a new request with availability
export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { assessment_result_id, patient_notes, availability } = body;

    if (!availability || !Array.isArray(availability) || availability.length === 0) {
      return NextResponse.json({ error: "At least one availability window is required" }, { status: 400 });
    }

    // Validate each availability block
    for (const block of availability) {
      if (!block.available_from || !block.available_until) {
        return NextResponse.json({ error: "Each availability block must have available_from and available_until" }, { status: 400 });
      }
      if (new Date(block.available_from) >= new Date(block.available_until)) {
        return NextResponse.json({ error: "available_from must be before available_until" }, { status: 400 });
      }
    }

    // If no assessment ID provided, auto-link to the patient's most recent assessment
    let resolvedAssessmentId = assessment_result_id ?? null;
    if (!resolvedAssessmentId) {
      const { data: latest } = await db
        .from("assessment_results")
        .select("id")
        .eq("patient_id", session.patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      resolvedAssessmentId = latest?.id ?? null;
    }

    // Create the consultation request
    const { data: request, error: requestError } = await db
      .from("consultation_requests")
      .insert({
        patient_id: session.patientId,
        assessment_result_id: resolvedAssessmentId,
        patient_notes: patient_notes ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (requestError || !request) {
      console.error("[consultation-requests] Insert error:", requestError);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    // Insert availability blocks
    const { error: availError } = await db.from("patient_availability").insert(
      availability.map((block: { available_from: string; available_until: string }) => ({
        consultation_request_id: request.id,
        available_from: block.available_from,
        available_until: block.available_until,
      }))
    );

    if (availError) {
      console.error("[consultation-requests] Availability insert error:", availError);
      // Clean up the request if availability insert failed
      await db.from("consultation_requests").delete().eq("id", request.id);
      return NextResponse.json({ error: "Failed to save availability" }, { status: 500 });
    }

    await logAuditEvent(
      "patient",
      session.patientId,
      "create_consultation_request",
      "consultation_requests",
      request.id,
      getClientIp(req)
    );

    return NextResponse.json({ request: { id: request.id } }, { status: 201 });
  } catch (err) {
    console.error("[consultation-requests] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
