"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setIsSubmitting(false);
    setSubmitted(true);
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
          <Link
            href="/login"
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Reset your password</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">Check your inbox</p>
                  <p className="text-gray-500 text-sm">
                    If an account exists for <strong>{email}</strong>, we&apos;ve sent
                    a password reset link. It expires in 1 hour.
                  </p>
                  <p className="text-gray-400 text-xs mt-4">
                    Don&apos;t see it? Check your spam folder.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 text-sm mb-6">
                    Enter the email address associated with your account and
                    we&apos;ll send you a reset link.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="you@example.com"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || !email}
                    >
                      {isSubmitting ? (
                        "Sending…"
                      ) : (
                        <><Mail className="h-4 w-4 mr-2" />Send reset link</>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
