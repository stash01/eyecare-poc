import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";

// GET /api/availability?provider_id=UUID&date=YYYY-MM-DD
// Returns available 30-min slot ISO strings for the given provider and date.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("provider_id");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!providerId || !date) {
    return NextResponse.json({ error: "provider_id and date are required" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const dayOfWeek = new Date(date + "T12:00:00").getDay(); // noon avoids DST edge cases

  // Get the provider's availability windows for this day of week
  const { data: windows, error: windowsError } = await db
    .from("provider_availability")
    .select("start_time, end_time, slot_minutes")
    .eq("provider_id", providerId)
    .eq("day_of_week", dayOfWeek);

  if (windowsError) {
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }

  if (!windows || windows.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  // Generate all possible slot start times (as "HH:MM" strings)
  const allSlots: string[] = [];
  for (const window of windows) {
    const [startH, startM] = window.start_time.split(":").map(Number);
    const [endH, endM] = window.end_time.split(":").map(Number);
    let cur = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (cur + window.slot_minutes <= end) {
      const h = String(Math.floor(cur / 60)).padStart(2, "0");
      const m = String(cur % 60).padStart(2, "0");
      allSlots.push(`${h}:${m}`);
      cur += window.slot_minutes;
    }
  }

  // Fetch existing booked appointments for this provider on this date
  const dayStart = `${date}T00:00:00+00:00`;
  const dayEnd = `${date}T23:59:59+00:00`;

  const { data: booked } = await db
    .from("appointments")
    .select("scheduled_at")
    .eq("provider_uuid", providerId)
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd)
    .not("status", "eq", "cancelled");

  // Build a set of booked HH:MM times (in local EST — approximated as UTC-5 for POC)
  const bookedTimes = new Set(
    (booked ?? []).map((a) => {
      const d = new Date(a.scheduled_at);
      // Convert to EST (UTC-5) for display alignment
      const est = new Date(d.getTime() - 5 * 60 * 60 * 1000);
      return `${String(est.getUTCHours()).padStart(2, "0")}:${String(est.getUTCMinutes()).padStart(2, "0")}`;
    })
  );

  const available = allSlots.filter((slot) => !bookedTimes.has(slot));

  // Return as ISO strings so the client can display and submit without ambiguity
  const slots = available.map((slot) => {
    const [h, m] = slot.split(":").map(Number);
    // Store as EST (UTC-5) — adjust when moving to production with proper timezone handling
    const utcHour = h + 5;
    return `${date}T${String(utcHour).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`;
  });

  return NextResponse.json({ slots });
}
