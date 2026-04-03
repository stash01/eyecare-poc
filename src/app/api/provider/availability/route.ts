import { NextRequest, NextResponse } from "next/server";
import { validateProviderSession } from "@/lib/server/provider-session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// GET /api/provider/availability — returns authenticated provider's weekly availability
export async function GET() {
  const session = await validateProviderSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await db
    .from("provider_availability")
    .select("id, day_of_week, start_time, end_time, slot_minutes")
    .eq("provider_id", session.providerId)
    .order("day_of_week", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }

  return NextResponse.json({ availability: data ?? [] });
}

// PUT /api/provider/availability — replaces all availability rows for the provider
// Body: { availability: [{ dayOfWeek: 0-6, startTime: "HH:MM", endTime: "HH:MM", slotMinutes: 15 }] }
export async function PUT(req: NextRequest) {
  const session = await validateProviderSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { availability } = await req.json();
  if (!Array.isArray(availability)) {
    return NextResponse.json({ error: "availability must be an array" }, { status: 400 });
  }

  // Delete existing and insert new rows in a single transaction via sequential calls
  const { error: deleteError } = await db
    .from("provider_availability")
    .delete()
    .eq("provider_id", session.providerId);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }

  if (availability.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const rows = availability.map((a: { dayOfWeek: number; startTime: string; endTime: string; slotMinutes?: number }) => ({
    provider_id: session.providerId,
    day_of_week: a.dayOfWeek,
    start_time: a.startTime,
    end_time: a.endTime,
    slot_minutes: a.slotMinutes ?? 15,
  }));

  const { error: insertError } = await db.from("provider_availability").insert(rows);

  if (insertError) {
    return NextResponse.json({ error: "Failed to save availability" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
