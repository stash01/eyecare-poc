// src/app/provider/appointments/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Eye, Video, ArrowLeft, User, Calendar, Clock,
  Activity, Shield, AlertTriangle, Loader2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AppointmentDetail {
  id: string
  scheduledAt: string
  durationMinutes: number
  status: string
  videoRoomUrl: string | null
  patient: {
    firstName: string
    lastName: string
    email: string
  }
  assessment: {
    severity: string
    riskTier: string
    frequencyScore: number
    intensityScore: number
    frequencySeverity: string
    intensitySeverity: string
    riskFactorCount: number
    priorTreatment: boolean
    ocularConditions: string[]
    medicalConditions: string[]
    pastFailedTreatments: string[]
    currentTreatments: string[]
  } | null
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-CA", {
    weekday: "long", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto",
  })
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  mild: { color: "text-green-700", bg: "bg-green-50 border-green-200" },
  moderate: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  severe: { color: "text-red-700", bg: "bg-red-50 border-red-200" },
}

export default function ProviderAppointmentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [detail, setDetail] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/provider/appointments/${id}`)
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json() })
      .then(data => setDetail(data.appointment))
      .catch(() => setError("Failed to load appointment details."))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  if (error || !detail) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="text-gray-700 mb-4">{error ?? "Appointment not found."}</p>
            <Link href="/provider/dashboard" className={cn(buttonVariants())}>
              Back to Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const asmt = detail.assessment
  const sc = asmt ? (SEVERITY_CONFIG[asmt.severity] ?? SEVERITY_CONFIG.mild) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary-600" />
            <span className="font-semibold text-gray-900">Pre-Consultation Summary</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Patient + appointment info */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Patient Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name:</span><span className="font-medium">{detail.patient.firstName} {detail.patient.lastName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email:</span><span className="font-medium">{detail.patient.email}</span></div>
            <div className="flex items-center gap-2 pt-2 text-gray-500"><Calendar className="h-4 w-4" /><span>{fmtDateTime(detail.scheduledAt)}</span></div>
            <div className="flex items-center gap-2 text-gray-500"><Clock className="h-4 w-4" /><span>{detail.durationMinutes} minute consultation</span></div>
          </CardContent>
        </Card>

        {/* Video room */}
        {detail.videoRoomUrl && (
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-primary-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Video Room Ready</p>
                    <p className="text-sm text-gray-600">Click to join when the patient is ready.</p>
                  </div>
                </div>
                <a
                  href={detail.videoRoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants())}
                >
                  Join Video Call
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment summary */}
        {asmt && sc ? (
          <>
            <Card className={`border-2 ${sc.bg}`}>
              <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Assessment Results</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Severity</p>
                    <p className={`text-2xl font-bold capitalize mt-1 ${sc.color}`}>{asmt.severity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Frequency</p>
                    <p className="text-2xl font-bold mt-1">{asmt.frequencyScore}<span className="text-sm text-gray-500">/24</span></p>
                    <p className="text-xs text-gray-500 capitalize">{asmt.frequencySeverity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Intensity</p>
                    <p className="text-2xl font-bold mt-1">{asmt.intensityScore}<span className="text-sm text-gray-500">/60</span></p>
                    <p className="text-xs text-gray-500 capitalize">{asmt.intensitySeverity}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Risk Tier</p>
                    <p className="font-medium capitalize">{asmt.riskTier} ({asmt.riskFactorCount} risk factors)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prior Treatment</p>
                    <p className="font-medium">{asmt.priorTreatment ? "Yes" : "No"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical history */}
            {(asmt.ocularConditions.length > 0 || asmt.medicalConditions.length > 0) && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Relevant History</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-3">
                  {asmt.ocularConditions.filter(c => c !== "none").length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ocular Conditions</p>
                      <ul className="list-disc list-inside space-y-0.5">{asmt.ocularConditions.filter(c => c !== "none").map((c, i) => <li key={i} className="capitalize">{c.replace(/_/g, " ")}</li>)}</ul>
                    </div>
                  )}
                  {asmt.medicalConditions.filter(c => c !== "none").length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Medical Conditions</p>
                      <ul className="list-disc list-inside space-y-0.5">{asmt.medicalConditions.filter(c => c !== "none").map((c, i) => <li key={i} className="capitalize">{c.replace(/_/g, " ")}</li>)}</ul>
                    </div>
                  )}
                  {asmt.pastFailedTreatments.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Past Failed Treatments</p>
                      <ul className="list-disc list-inside space-y-0.5">{asmt.pastFailedTreatments.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No assessment on file for this appointment.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
