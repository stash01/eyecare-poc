import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/server/stripe";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = getStripe();

  // CRITICAL: Must use req.text() — signature verification requires raw body bytes.
  // Using req.json() would re-serialize and break the HMAC signature.
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          stripe,
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case "invoice.payment_failed":
        console.warn(
          "[webhook] Payment failed for invoice:",
          (event.data.object as Stripe.Invoice).id
        );
        await logAuditEvent(
          "system",
          null,
          "invoice_payment_failed",
          "invoice",
          (event.data.object as Stripe.Invoice).id ?? null,
          null
        );
        break;
    }
  } catch (err) {
    // Return 500 so Stripe retries the webhook
    console.error(`[webhook] Handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const patientId = session.metadata?.patientId;
  if (!patientId) {
    console.error(
      "[webhook] checkout.session.completed missing patientId in metadata"
    );
    return;
  }

  if (session.mode === "subscription") {
    const subscriptionId = session.subscription as string;

    const standardPriceId = process.env.STRIPE_MEMBERSHIP_PRICE_STANDARD_ID;
    const introPriceId = process.env.STRIPE_MEMBERSHIP_PRICE_INTRO_ID;
    if (!standardPriceId || !introPriceId) {
      throw new Error(
        "Missing env: STRIPE_MEMBERSHIP_PRICE_INTRO_ID or STRIPE_MEMBERSHIP_PRICE_STANDARD_ID"
      );
    }

    // Convert the flat subscription into a 2-phase schedule:
    // Phase 1: 3 billing cycles at $129/month (intro price)
    // Phase 2: $59/month forever
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscriptionId,
    });

    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: introPriceId, quantity: 1 }],
          duration: { interval: "month", interval_count: 3 },
        },
        {
          items: [{ price: standardPriceId, quantity: 1 }],
        },
      ],
    });

    await db
      .from("patients")
      .update({
        subscription_plan: "klara_membership",
        stripe_subscription_id: subscriptionId,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", patientId);

    await logAuditEvent(
      "system",
      patientId,
      "subscription_activated",
      "subscription",
      subscriptionId,
      null
    );
  } else if (session.mode === "payment") {
    const lineItemsResult = await stripe.checkout.sessions.listLineItems(
      session.id
    );

    const lineItemsSnapshot = lineItemsResult.data.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      amountTotal: li.amount_total,
    }));

    await db.from("orders").insert({
      patient_id: patientId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string ?? null,
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? "cad",
      status: "paid",
      customer_email: session.customer_details?.email ?? null,
      shipping_name: session.collected_information?.shipping_details?.name ?? null,
      shipping_address: session.collected_information?.shipping_details?.address ?? null,
      line_items: lineItemsSnapshot,
      updated_at: new Date().toISOString(),
    });

    await logAuditEvent(
      "system",
      patientId,
      "order_placed",
      "order",
      session.id,
      null
    );
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: patient } = await db
    .from("patients")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!patient) {
    console.warn(
      "[webhook] subscription.deleted — no patient found for customer:",
      customerId
    );
    return;
  }

  await db
    .from("patients")
    .update({
      subscription_plan: null,
      stripe_subscription_id: null,
      subscription_status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", patient.id);

  await logAuditEvent(
    "system",
    patient.id,
    "subscription_canceled",
    "subscription",
    subscription.id,
    null
  );
}
