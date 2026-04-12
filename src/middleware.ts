// src/middleware.ts
import { NextRequest, NextResponse } from "next/server"

const PATIENT_SESSION_COOKIE = "klaramd_session"
const PROVIDER_SESSION_COOKIE = "klaramd_provider_session"

// Require patient login only (no subscription check)
const LOGIN_REQUIRED_PATHS = [
  "/patient/assessment",
  "/subscribe",
]

// Require patient login (subscription validated server-side in pages/APIs)
const SUBSCRIPTION_PATHS = [
  "/patient/results",
  "/patient/booking",
  "/patient/dashboard",
  "/patient/shop",
]

function hasValidToken(req: NextRequest, cookieName: string): boolean {
  const token = req.cookies.get(cookieName)?.value
  return !!token && /^[0-9a-f]{64}$/.test(token)
}

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const hasPatientSession = hasValidToken(req, PATIENT_SESSION_COOKIE)
  const hasProviderSession = hasValidToken(req, PROVIDER_SESSION_COOKIE)

  // ── Provider routes ────────────────────────────────────────────────────────
  const isProviderLogin = pathname === "/provider/login"
  const isProviderRoute = !isProviderLogin && pathname.startsWith("/provider")

  if (isProviderRoute && !hasProviderSession) {
    const loginUrl = new URL("/provider/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Patient: login required ────────────────────────────────────────────────
  if (matchesPath(pathname, [...LOGIN_REQUIRED_PATHS, ...SUBSCRIPTION_PATHS]) && !hasPatientSession) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Security headers ───────────────────────────────────────────────────────
  const response = NextResponse.next()

  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  const isStripeCheckout =
    pathname === "/subscribe" ||
    pathname.startsWith("/subscribe/") ||
    pathname === "/patient/shop/checkout"

  const isProviderConsultation = pathname.startsWith("/provider/appointments/")
  response.headers.set(
    "Permissions-Policy",
    isProviderConsultation
      ? "camera=(self), microphone=(self), geolocation=()"
      : "camera=(), microphone=(), geolocation=()"
  )

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  }

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.stripe.com",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com",
      isProviderConsultation
        ? "frame-src https://*.daily.co"
        : isStripeCheckout
          ? "frame-src https://js.stripe.com"
          : "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://hooks.stripe.com",
    ].join("; ")
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
