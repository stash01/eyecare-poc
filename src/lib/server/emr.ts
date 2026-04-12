// src/lib/server/emr.ts
// EMR adapter interface + mock implementation.
// IMPORTANT: server-only — never import from a "use client" module.
// To connect a real EMR: implement EmrAdapter, replace the export at the bottom.

export interface EmrProvider {
  id: string
  name: string
  credentials: string
  specialty: string
  subspecialty: string | null
  expertise: string[]
  cpsoNumber: string | null
}

export interface EmrSlot {
  providerId: string
  startAt: string   // ISO 8601 UTC
  endAt: string     // ISO 8601 UTC
  durationMinutes: number
}

export interface EmrAdapter {
  /** List active providers. */
  getProviders(): Promise<EmrProvider[]>

  /** Available slots for a provider over the next N days. */
  getSlots(params: { providerId: string; days: number }): Promise<EmrSlot[]>

  /**
   * Book a slot. Returns emr_appointment_id.
   * Throws SlotTakenError if the slot was taken between fetch and book.
   */
  bookAppointment(params: {
    emrPatientId: string
    providerId: string
    startAt: string
    durationMinutes: number
  }): Promise<{ emrAppointmentId: string }>

  /**
   * Get or create a patient record in the EMR.
   * Returns the EMR patient ID (stored on patients.emr_patient_id).
   */
  ensurePatient(params: {
    firstName: string
    lastName: string
    email: string
    dateOfBirth: string
    healthCardNumber?: string
  }): Promise<string>

  /**
   * Push an assessment as a chart note linked to an appointment.
   * Returns the EMR note ID.
   */
  pushNote(params: {
    emrPatientId: string
    emrAppointmentId: string
    noteText: string
    date: string  // YYYY-MM-DD
  }): Promise<{ emrNoteId: string }>
}

export class SlotTakenError extends Error {
  constructor() {
    super("That time slot is no longer available")
    this.name = "SlotTakenError"
  }
}

// ─── Mock Implementation ──────────────────────────────────────────────────────

const MOCK_PROVIDERS: EmrProvider[] = [
  {
    id: "mock-provider-001",
    name: "Dr. Sarah Chen",
    credentials: "MD, FRCSC",
    specialty: "Ophthalmologist",
    subspecialty: "Cornea & External Disease",
    expertise: ["Dry Eye Disease", "Ocular Surface Disorders", "Corneal Conditions"],
    cpsoNumber: "12345",
  },
  {
    id: "mock-provider-002",
    name: "Dr. James Wilson",
    credentials: "MD, FRCSC",
    specialty: "Ophthalmologist",
    subspecialty: "Oculoplastics & Tear Film",
    expertise: ["Meibomian Gland Dysfunction", "Blepharitis", "Punctal Procedures"],
    cpsoNumber: "67891",
  },
]

class MockEmrAdapter implements EmrAdapter {
  private bookedSlots = new Set<string>()

  async getProviders(): Promise<EmrProvider[]> {
    return MOCK_PROVIDERS
  }

  async getSlots(params: { providerId: string; days: number }): Promise<EmrSlot[]> {
    const slots: EmrSlot[] = []
    const now = new Date()

    for (let d = 1; d <= params.days; d++) {
      const date = new Date(now)
      date.setDate(now.getDate() + d)
      const dow = date.getDay()
      if (dow === 0 || dow === 6) continue

      const dateStr = date.toISOString().split("T")[0]

      const windows = [
        { startH: 14, endH: 17 },
        { startH: 18, endH: 22 },
      ]

      for (const w of windows) {
        for (let h = w.startH; h < w.endH; h++) {
          for (const m of [0, 30]) {
            const startAt = `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`
            const endAt = new Date(new Date(startAt).getTime() + 30 * 60_000).toISOString()
            const key = `${params.providerId}::${startAt}`

            if (!this.bookedSlots.has(key)) {
              slots.push({ providerId: params.providerId, startAt, endAt, durationMinutes: 30 })
            }
          }
        }
      }
    }

    return slots
  }

  async bookAppointment(params: {
    emrPatientId: string
    providerId: string
    startAt: string
    durationMinutes: number
  }): Promise<{ emrAppointmentId: string }> {
    const key = `${params.providerId}::${params.startAt}`

    if (this.bookedSlots.has(key)) {
      throw new SlotTakenError()
    }

    this.bookedSlots.add(key)
    const emrAppointmentId = `mock-appt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return { emrAppointmentId }
  }

  async ensurePatient(params: {
    firstName: string
    lastName: string
    email: string
    dateOfBirth: string
    healthCardNumber?: string
  }): Promise<string> {
    const hash = Buffer.from(params.email).toString("base64").slice(0, 12)
    return `mock-patient-${hash}`
  }

  async pushNote(params: {
    emrPatientId: string
    emrAppointmentId: string
    noteText: string
    date: string
  }): Promise<{ emrNoteId: string }> {
    const emrNoteId = `mock-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return { emrNoteId }
  }
}

// ── Active implementation ─────────────────────────────────────────────────────
// Swap this line to connect a real EMR client.
export const emr: EmrAdapter = new MockEmrAdapter()
