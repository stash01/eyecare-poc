import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";
import { logAuditEvent } from "@/lib/server/audit";

const VALID_PLANS = ["klara_membership"];

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// POST /api/subscriptions — set subscription plan
// Phase 2: replace with Stripe Checkout session creation
export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { plan } = body;

  if (!plan || !VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { error } = await db
    .from("patients")
    .update({ subscription_plan: plan, updated_at: new Date().toISOString() })
    .eq("id", session.patientId);

  if (error) {
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }

  await logAuditEvent(
    "patient",
    session.patientId,
    "subscribe",
    "patient",
    session.patientId,
    getClientIp(req),
    { plan }
  );

  return NextResponse.json({ ok: true, plan });
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
