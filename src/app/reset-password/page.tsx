"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "idle" | "submitting" | "success" | "error";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword;
  const isValid = password.length >= 8 && passwordsMatch && !!token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setStatus("submitting");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMessage(data.error ?? "Something went wrong.");
    }
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
            <CardHeader>
              <CardTitle className="text-xl">Choose a new password</CardTitle>
            </CardHeader>
            <CardContent>

              {status === "success" && (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">Password updated</p>
                  <p className="text-gray-500 text-sm mb-6">
                    Your password has been changed. You can now sign in with your new password.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/login">Sign in</Link>
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="text-center py-4">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">Link expired or already used</p>
                  <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/forgot-password">Request a new reset link</Link>
                  </Button>
                </div>
              )}

              {(status === "idle" || status === "submitting") && (
                <>
                  {!token && (
                    <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      This reset link is invalid. Please{" "}
                      <Link href="/forgot-password" className="underline">
                        request a new one
                      </Link>
                      .
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm new password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          confirmPassword && !passwordsMatch
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300"
                        }`}
                      />
                      {confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!isValid || status === "submitting"}
                    >
                      {status === "submitting" ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating…</>
                      ) : (
                        "Set new password"
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
