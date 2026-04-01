// Jane App API Client (Phase 2 stub)
// Implement after obtaining Jane App API credentials from janeapp.com.
// All methods are no-ops if JANE_CLIENT_ID is not set — safe for Phase 1 deployment.
//
// IMPORTANT: This file is server-only. Never import from a "use client" module.
// Jane OAuth credentials must live in JANE_CLIENT_ID / JANE_CLIENT_SECRET env vars.

const JANE_BASE_URL = process.env.JANE_BASE_URL ?? "";
const JANE_CLIENT_ID = process.env.JANE_CLIENT_ID ?? "";
const JANE_CLIENT_SECRET = process.env.JANE_CLIENT_SECRET ?? "";

const isConfigured = !!JANE_CLIENT_ID;

// ─── Token management ────────────────────────────────────────────────────────

let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!isConfigured) throw new Error("Jane App credentials not configured");

  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.access_token;
  }

  const resp = await fetch(`${JANE_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: JANE_CLIENT_ID,
      client_secret: JANE_CLIENT_SECRET,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Jane token request failed: ${resp.status}`);
  }

  const data = await resp.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}

async function janeRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getAccessToken();

  const resp = await fetch(`${JANE_BASE_URL}/api/1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Jane API ${method} ${path} failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<T>;
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export interface JanePatient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export async function createJanePatient(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  healthCardNumber?: string;
}): Promise<string | null> {
  if (!isConfigured) return null;

  const patient = await janeRequest<JanePatient>("POST", "/patients", {
    first_name: params.firstName,
    last_name: params.lastName,
    email: params.email,
    phone_number: params.phone,
    date_of_birth: params.dateOfBirth,
    health_card_number: params.healthCardNumber,
    province_of_health_card: "ON",
  });

  return String(patient.id);
}

// ─── Availability ─────────────────────────────────────────────────────────────

export interface JaneTimeSlot {
  start_at: string;
  end_at: string;
}

export async function getJanePractitionerAvailability(
  practitionerId: string,
  date: string,
  durationMinutes = 30
): Promise<JaneTimeSlot[]> {
  if (!isConfigured) return [];

  return janeRequest<JaneTimeSlot[]>(
    "GET",
    `/practitioners/${practitionerId}/availability?date=${date}&duration=${durationMinutes}`
  );
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export interface JaneAppointment {
  id: number;
  online_meeting_url?: string;
}

export async function createJaneAppointment(params: {
  janePatientId: string;
  janePractitionerId: string;
  startAt: string;
  durationMinutes: number;
  note?: string;
}): Promise<{ janeAppointmentId: string; videoRoomUrl: string | null }> {
  if (!isConfigured) return { janeAppointmentId: "", videoRoomUrl: null };

  const appt = await janeRequest<JaneAppointment>("POST", "/appointments", {
    patient_id: Number(params.janePatientId),
    practitioner_id: Number(params.janePractitionerId),
    start_at: params.startAt,
    duration: params.durationMinutes,
    note: params.note,
  });

  return {
    janeAppointmentId: String(appt.id),
    videoRoomUrl: appt.online_meeting_url ?? null,
  };
}

// ─── Chart notes ─────────────────────────────────────────────────────────────

export async function createJaneChartNote(params: {
  janePatientId: string;
  content: string;
  date: string;
}): Promise<string | null> {
  if (!isConfigured) return null;

  const note = await janeRequest<{ id: number }>(
    "POST",
    `/patients/${params.janePatientId}/chart_entries`,
    {
      type: "note",
      date: params.date,
      content: params.content,
    }
  );

  return String(note.id);
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export async function createJaneInvoice(params: {
  janeAppointmentId: string;
  billingType: "ohip" | "private";
  serviceCode?: string;
  healthCardNumber?: string;
}): Promise<string | null> {
  if (!isConfigured) return null;

  const invoice = await janeRequest<{ id: number }>(
    "POST",
    `/appointments/${params.janeAppointmentId}/invoices`,
    {
      billing_type: params.billingType,
      service_codes: params.serviceCode
        ? [{ code: params.serviceCode, quantity: 1 }]
        : undefined,
      health_card_number: params.healthCardNumber,
      province: "ON",
    }
  );

  return String(invoice.id);
}
