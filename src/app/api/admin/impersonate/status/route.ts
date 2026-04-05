import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/server/session";
import { validateProviderSession } from "@/lib/server/provider-session";

export const dynamic = "force-dynamic";

const RESTORE_COOKIE = "klaramd_admin_restore";

// GET /api/admin/impersonate/status
export async function GET() {
  const restoreCookie = cookies().get(RESTORE_COOKIE);
  if (!restoreCookie?.value) {
    return NextResponse.json({ isImpersonating: false, displayName: null });
  }

  // Provider impersonation: klaramd_provider_session is set
  const providerSession = await validateProviderSession();
  if (providerSession) {
    return NextResponse.json({ isImpersonating: true, displayName: providerSession.name });
  }

  // Patient impersonation: klaramd_session has been replaced with the patient's token
  const patientSession = await validateSession();
  if (patientSession) {
    return NextResponse.json({
      isImpersonating: true,
      displayName: `${patientSession.firstName} ${patientSession.lastName}`,
    });
  }

  // Restore cookie present but sessions invalid — treat as not impersonating
  return NextResponse.json({ isImpersonating: false, displayName: null });
}
