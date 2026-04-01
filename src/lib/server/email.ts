import { Resend } from "resend";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing env: RESEND_API_KEY");
  return new Resend(apiKey);
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  token: string
): Promise<void> {
  const link = `${getAppUrl()}/verify-email?token=${token}`;
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: "KlaraMD <noreply@klaramd.com>",
    to,
    subject: "Verify your KlaraMD email address",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:22px;margin-bottom:8px">Hi ${firstName},</h1>
        <p style="color:#444;line-height:1.6">
          Thanks for creating a KlaraMD account. Please verify your email address
          to activate your account and access your dashboard.
        </p>
        <div style="margin:32px 0;text-align:center">
          <a href="${link}"
             style="background:#0f6fd8;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block">
            Verify email address
          </a>
        </div>
        <p style="color:#666;font-size:13px;line-height:1.6">
          This link expires in 24 hours. If you didn't create a KlaraMD account,
          you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="color:#999;font-size:12px">
          KlaraMD · Virtual eye care for Ontario patients
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  token: string
): Promise<void> {
  const link = `${getAppUrl()}/reset-password?token=${token}`;
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: "KlaraMD <noreply@klaramd.com>",
    to,
    subject: "Reset your KlaraMD password",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:22px;margin-bottom:8px">Hi ${firstName},</h1>
        <p style="color:#444;line-height:1.6">
          We received a request to reset your KlaraMD password.
          Click the button below to choose a new password.
        </p>
        <div style="margin:32px 0;text-align:center">
          <a href="${link}"
             style="background:#0f6fd8;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block">
            Reset password
          </a>
        </div>
        <p style="color:#666;font-size:13px;line-height:1.6">
          This link expires in 1 hour. If you didn't request a password reset,
          you can safely ignore this email — your password won't change.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="color:#999;font-size:12px">
          KlaraMD · Virtual eye care for Ontario patients
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
