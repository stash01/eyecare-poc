import { NextRequest, NextResponse } from "next/server";

const PATIENT_SESSION_COOKIE = "klaramd_session";
const PROVIDER_SESSION_COOKIE = "klaramd_provider_session";

// Paths requiring a patient session
const PATIENT_PATHS = [
  "/dashboard",
  "/assessment",
  "/assessment-results",
  "/booking",
  "/subscribe",
  "/shop",
  "/admin",
];

// Lightweight format check — full DB validation happens in each API route.
// A valid token is a 64-char hex string (32 random bytes).
function hasValidToken(req: NextRequest, cookieName: string): boolean {
  const token = req.cookies.get(cookieName)?.value;
  return !!token && /^[0-9a-f]{64}$/.test(token);
}

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasPatientSession = hasValidToken(req, PATIENT_SESSION_COOKIE);
  const hasProviderSession = hasValidToken(req, PROVIDER_SESSION_COOKIE);

  // ── Provider routes (/provider/login is public; everything else requires provider session) ──
  const isProviderLogin = pathname === "/provider/login";
  const isProviderRoute =
    !isProviderLogin && (pathname === "/provider" || pathname.startsWith("/provider/"));

  if (isProviderRoute && !hasProviderSession) {
    const loginUrl = new URL("/provider/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Patient routes ─────────────────────────────────────────────────────────
  if (matchesPath(pathname, PATIENT_PATHS) && !hasPatientSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Consultation (either patient or provider session) ──────────────────────
  const isConsultation =
    pathname === "/consultation" || pathname.startsWith("/consultation/");
  if (isConsultation && !hasPatientSession && !hasProviderSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Security headers ───────────────────────────────────────────────────────
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Camera + microphone only allowed on /consultation
  response.headers.set(
    "Permissions-Policy",
    isConsultation
      ? "camera=(self), microphone=(self), geolocation=()"
      : "camera=(), microphone=(), geolocation=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // CSP — allow Daily.co frames on /consultation, Stripe frames on checkout pages
  const isStripeCheckout =
    pathname === "/subscribe" ||
    pathname.startsWith("/subscribe/") ||
    pathname === "/shop/checkout";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.stripe.com",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com",
      isConsultation
        ? "frame-src https://*.daily.co"
        : isStripeCheckout
          ? "frame-src https://js.stripe.com"
          : "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://hooks.stripe.com",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
