import { Resend } from "resend";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing env: RESEND_API_KEY");
  return new Resend(apiKey);
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function toIcsDate(iso: string): string {
  // Convert ISO 8601 UTC to iCalendar format: YYYYMMDDTHHmmssZ
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace("Z", "Z");
}

function buildIcs(params: {
  uid: string;
  summary: string;
  description: string;
  startIso: string;
  durationMinutes: number;
  organizerEmail: string;
  organizerName: string;
  attendeeEmail: string;
}): string {
  const start = toIcsDate(new Date(params.startIso).toISOString());
  const endDate = new Date(new Date(params.startIso).getTime() + params.durationMinutes * 60_000);
  const end = toIcsDate(endDate.toISOString());
  const now = toIcsDate(new Date().toISOString());
  const desc = params.description.replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KlaraMD//KlaraMD//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${params.uid}@klaramd.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${params.summary}`,
    `DESCRIPTION:${desc}`,
    `ORGANIZER;CN=${params.organizerName}:mailto:${params.organizerEmail}`,
    `ATTENDEE;CN=${params.attendeeEmail};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:mailto:${params.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export async function sendAppointmentConfirmation(params: {
  appointmentId: string;
  scheduledAt: string;
  durationMinutes: number;
  videoRoomUrl: string | null;
  patient: { email: string; firstName: string; lastName: string };
  provider: { email: string; name: string; credentials: string };
}): Promise<void> {
  const resend = getResend();
  const { appointmentId, scheduledAt, durationMinutes, videoRoomUrl, patient, provider } = params;

  const formattedDate = formatDateTime(scheduledAt);
  const subject = `Your KlaraMD appointment – ${formattedDate}`;
  const meetingSection = videoRoomUrl
    ? `<div style="margin:24px 0;text-align:center">
        <a href="${videoRoomUrl}" style="background:#0f6fd8;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block">
          Join Video Appointment
        </a>
       </div>`
    : `<p style="color:#666;font-size:13px">A video meeting link will be sent shortly if one has not already been provided.</p>`;

  const icsDescription = videoRoomUrl
    ? `KlaraMD appointment\\nJoin meeting: ${videoRoomUrl}`
    : "KlaraMD appointment";

  const patientIcs = buildIcs({
    uid: appointmentId,
    summary: `KlaraMD Appointment with ${provider.name}`,
    description: icsDescription,
    startIso: scheduledAt,
    durationMinutes,
    organizerEmail: provider.email,
    organizerName: provider.name,
    attendeeEmail: patient.email,
  });

  const providerIcs = buildIcs({
    uid: appointmentId,
    summary: `KlaraMD Appointment with ${patient.firstName} ${patient.lastName}`,
    description: icsDescription,
    startIso: scheduledAt,
    durationMinutes,
    organizerEmail: provider.email,
    organizerName: provider.name,
    attendeeEmail: provider.email,
  });

  const icsAttachment = (ics: string) => ({
    filename: "klara-appointment.ics",
    content: Buffer.from(ics).toString("base64"),
  });

  const patientHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
      <h1 style="font-size:22px;margin-bottom:8px">Hi ${patient.firstName},</h1>
      <p style="color:#444;line-height:1.6">Your KlaraMD appointment has been confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#666;font-size:13px;width:120px">Provider</td><td style="padding:8px 0;font-weight:600">${provider.name}${provider.credentials ? ", " + provider.credentials : ""}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px">Date &amp; Time</td><td style="padding:8px 0;font-weight:600">${formattedDate}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px">Duration</td><td style="padding:8px 0">${durationMinutes} minutes</td></tr>
      </table>
      ${meetingSection}
      <p style="color:#666;font-size:13px;line-height:1.6">A calendar invite is attached. If you need to cancel or reschedule, please log in to your KlaraMD dashboard.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="color:#999;font-size:12px">KlaraMD · Virtual eye care for Ontario patients</p>
    </div>
  `;

  const providerHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
      <h1 style="font-size:22px;margin-bottom:8px">Appointment confirmed</h1>
      <p style="color:#444;line-height:1.6">A new appointment has been scheduled.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#666;font-size:13px;width:120px">Patient</td><td style="padding:8px 0;font-weight:600">${patient.firstName} ${patient.lastName}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px">Date &amp; Time</td><td style="padding:8px 0;font-weight:600">${formattedDate}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px">Duration</td><td style="padding:8px 0">${durationMinutes} minutes</td></tr>
      </table>
      ${meetingSection}
      <p style="color:#666;font-size:13px;line-height:1.6">A calendar invite is attached for your records.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="color:#999;font-size:12px">KlaraMD · Virtual eye care for Ontario patients</p>
    </div>
  `;

  const sends = [
    resend.emails.send({
      from: "KlaraMD <noreply@klaramd.com>",
      to: patient.email,
      subject,
      html: patientHtml,
      attachments: [icsAttachment(patientIcs)],
    }),
  ];

  if (provider.email) {
    sends.push(
      resend.emails.send({
        from: "KlaraMD <noreply@klaramd.com>",
        to: provider.email,
        subject,
        html: providerHtml,
        attachments: [icsAttachment(providerIcs)],
      })
    );
  }

  await Promise.all(sends);
}

export async function sendAppointmentReminder(params: {
  appointmentId: string;
  scheduledAt: string;
  durationMinutes: number;
  videoRoomUrl: string | null;
  patient: { email: string; firstName: string };
  provider: { email: string; name: string };
}): Promise<void> {
  const resend = getResend();
  const { scheduledAt, durationMinutes, videoRoomUrl, patient, provider } = params;

  const formattedDate = formatDateTime(scheduledAt);
  const subject = "Reminder: KlaraMD appointment in 1 hour";
  const meetingSection = videoRoomUrl
    ? `<div style="margin:24px 0;text-align:center">
        <a href="${videoRoomUrl}" style="background:#0f6fd8;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block">
          Join Video Appointment
        </a>
       </div>`
    : "";

  const patientHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
      <h1 style="font-size:22px;margin-bottom:8px">Reminder: Your appointment is in 1 hour</h1>
      <p style="color:#444;line-height:1.6">Hi ${patient.firstName}, this is a reminder about your upcoming KlaraMD appointment.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#666;font-size:13px;width:120px">Provider</td><td style="padding:8px 0;font-weight:600">${provider.name}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px">Date &amp; Time</td><td style="padding:8px 0;font-weight:600">${formattedDate}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px">Duration</td><td style="padding:8px 0">${durationMinutes} minutes</td></tr>
      </table>
      ${meetingSection}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="color:#999;font-size:12px">KlaraMD · Virtual eye care for Ontario patients</p>
    </div>
  `;

  const providerHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
      <h1 style="font-size:22px;margin-bottom:8px">Reminder: Appointment in 1 hour</h1>
      <p style="color:#444;line-height:1.6">Patient: <strong>${patient.firstName}</strong> has an appointment with you in 1 hour.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#666;font-size:13px;width:120px">Date &amp; Time</td><td style="padding:8px 0;font-weight:600">${formattedDate}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:13px">Duration</td><td style="padding:8px 0">${durationMinutes} minutes</td></tr>
      </table>
      ${meetingSection}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="color:#999;font-size:12px">KlaraMD · Virtual eye care for Ontario patients</p>
    </div>
  `;

  await Promise.all([
    resend.emails.send({
      from: "KlaraMD <noreply@klaramd.com>",
      to: patient.email,
      subject,
      html: patientHtml,
    }),
    resend.emails.send({
      from: "KlaraMD <noreply@klaramd.com>",
      to: provider.email,
      subject,
      html: providerHtml,
    }),
  ]);
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
