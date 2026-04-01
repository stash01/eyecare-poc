import { NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await validateSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch current subscription plan from DB
    const { data: patient } = await db
      .from("patients")
      .select("subscription_plan")
      .eq("id", session.patientId)
      .single();

    return NextResponse.json({
      user: {
        id: session.patientId,
        firstName: session.firstName,
        lastName: session.lastName,
        email: session.email,
        subscriptionPlan: patient?.subscription_plan ?? null,
      },
    });
  } catch (err) {
    console.error("[me] Error:", err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
