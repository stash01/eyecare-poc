import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return NextResponse.json({
    status: session.status,
    customerEmail: session.customer_details?.email ?? null,
    amountTotal: session.amount_total,
  });
}
