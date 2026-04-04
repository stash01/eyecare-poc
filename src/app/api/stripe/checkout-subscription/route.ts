import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { getStripe } from "@/lib/server/stripe";
import { getClientIp } from "@/lib/server/request";
import { logAuditEvent } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const introPriceId = process.env.STRIPE_MEMBERSHIP_PRICE_INTRO_ID;
  if (!introPriceId) {
    return NextResponse.json(
      { error: "Stripe membership price not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { assessmentParams } = body as { assessmentParams?: string };

  // Look up patient
  const { data: patient } = await db
    .from("patients")
    .select("stripe_customer_id, email, first_name, last_name")
    .eq("id", session.patientId)
    .single();

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const stripe = getStripe();

  // Create Stripe customer if not already linked
  let customerId = patient.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: patient.email,
      name: `${patient.first_name} ${patient.last_name}`,
      metadata: { patientId: session.patientId },
    });
    customerId = customer.id;

    await db
      .from("patients")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("id", session.patientId);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? "";

  const returnUrl = assessmentParams
    ? `${baseUrl}/subscribe/return?${assessmentParams}`
    : `${baseUrl}/subscribe/return`;

  const checkoutSession = await stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: introPriceId, quantity: 1 }],
    return_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      patientId: session.patientId,
      assessmentParams: assessmentParams ?? "",
    },
  });

  await logAuditEvent(
    "patient",
    session.patientId,
    "checkout_session_created",
    "subscription",
    checkoutSession.id,
    getClientIp(req)
  );

  return NextResponse.json({ clientSecret: checkoutSession.client_secret });
}
