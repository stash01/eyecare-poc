import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/server/request";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";

import { logAuditEvent } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

const VALID_PLANS = ["klara_membership"];

// POST /api/subscriptions — superseded by POST /api/stripe/checkout-subscription
export async function POST() {
  return NextResponse.json(
    { error: "Use /api/stripe/checkout-subscription for subscription checkout" },
    { status: 410 }
  );
}

// DELETE /api/subscriptions — cancel subscription
export async function DELETE(req: NextRequest) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await db
    .from("patients")
    .update({ subscription_plan: null, updated_at: new Date().toISOString() })
    .eq("id", session.patientId);

  if (error) {
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }

  await logAuditEvent(
    "patient",
    session.patientId,
    "cancel_subscription",
    "patient",
    session.patientId,
    getClientIp(req)
  );

  return NextResponse.json({ ok: true });
}
