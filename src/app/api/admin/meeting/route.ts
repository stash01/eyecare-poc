import { NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// POST /api/admin/meeting — create an ad-hoc Daily.co room (admin only)
export async function POST() {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ url: null, message: "DAILY_API_KEY not configured" });
  }

  const roomId = randomBytes(6).toString("hex"); // e.g. "klara-adhoc-a1b2c3d4e5f6"
  const expireAt = Math.floor(Date.now() / 1000) + 4 * 60 * 60; // 4 hours from now

  try {
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: `klara-adhoc-${roomId}`,
        privacy: "public",
        properties: {
          exp: expireAt,
          eject_at_room_exp: true,
          enable_chat: true,
          enable_screenshare: true,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[admin/meeting] Daily.co error:", res.status, body);
      return NextResponse.json({ error: "Failed to create room" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.url as string });
  } catch (err) {
    console.error("[admin/meeting] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
