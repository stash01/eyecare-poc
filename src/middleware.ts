import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const PROTECTED_PATHS = [
  "/dashboard",
  "/assessment",
  "/assessment-results",
  "/booking",
  "/consultation",
  "/provider",
  "/subscribe",
  "/shop",
];

const SESSION_COOKIE = "klaramd_session";

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Lightweight session check in middleware — just verifies the cookie exists and is plausible.
// Full DB validation happens in each API route via validateSession().
function hasSessionCookie(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  // A valid session token is a 64-char hex string (32 bytes from randomBytes)
  return !!token && /^[0-9a-f]{64}$/.test(token);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Auth guard on protected routes ────────────────────────────────────────
  if (isProtected(pathname) && !hasSessionCookie(req)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Security headers on all responses ─────────────────────────────────────
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // Content-Security-Policy
  // Note: 'unsafe-inline' is required by Next.js for style injection.
  // Tighten script-src once you have a nonce-based CSP setup.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // tighten after nonce setup
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
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
