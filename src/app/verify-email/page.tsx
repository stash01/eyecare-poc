"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Status = "pending" | "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function verify() {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error ?? "Verification failed.");
      }
    }

    verify();
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setIsResending(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resendEmail }),
    });
    setIsResending(false);
    setResendSent(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Eye className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-md mx-auto mt-12">
          <Card>
            <CardContent className="pt-8 pb-8 text-center">

              {/* Pending — no token in URL */}
              {status === "pending" && (
                <>
                  <Mail className="h-14 w-14 text-primary-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
                  <p className="text-gray-600 mb-6">
                    We sent a verification link to your email address.
                    Click the link to activate your account.
                  </p>
                  <p className="text-sm text-gray-500 mb-8">
                    Didn&apos;t receive it? Check your spam folder, or enter your
                    email below to resend.
                  </p>

                  {resendSent ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      Verification email sent — check your inbox.
                    </div>
                  ) : (
                    <form onSubmit={handleResend} className="space-y-3 text-left">
                      <input
                        type="email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isResending}
                      >
                        {isResending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                        ) : (
                          "Resend verification email"
                        )}
                      </Button>
                    </form>
                  )}
                </>
              )}

              {/* Verifying — token in URL, awaiting API response */}
              {status === "verifying" && (
                <>
                  <Loader2 className="h-14 w-14 text-primary-500 mx-auto mb-4 animate-spin" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email…</h1>
                  <p className="text-gray-500 text-sm">This will only take a moment.</p>
                </>
              )}

              {/* Success */}
              {status === "success" && (
                <>
                  <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h1>
                  <p className="text-gray-600 mb-8">
                    Your account is now active. You can sign in and get started.
                  </p>
                  <Link href="/login" className={buttonVariants({ className: "w-full" })}>
                    Sign in to your account
                  </Link>
                </>
              )}

              {/* Error */}
              {status === "error" && (
                <>
                  <XCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification failed</h1>
                  <p className="text-gray-600 mb-8">{errorMessage}</p>
                  <Link href="/verify-email" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                    Request a new link
                  </Link>
                </>
              )}

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
