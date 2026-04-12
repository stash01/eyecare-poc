// src/app/provider/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useProviderAuth } from "@/lib/provider-auth-context"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Calendar, Clock, Video, User, LogOut, ChevronRight, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Appointment {
  id: string
  scheduledAt: string
  durationMinutes: number
  status: string
  videoRoomUrl: string | null
  patientName: string
  assessmentSeverity: string | null
  assessmentRiskTier: string | null
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-CA", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto",
  })
}

const SEVERITY_COLOR: Record<string, string> = {
  mild: "text-green-700 bg-green-100",
  moderate: "text-amber-700 bg-amber-100",
  severe: "text-red-700 bg-red-100",
}

export default function ProviderDashboard() {
  const { provider, logout } = useProviderAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/provider/appointments")
      .then(r => r.json())
      .then(data => setAppointments(data.appointments ?? []))
      .catch(() => setError("Failed to load appointments."))
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric", timeZone: "America/Toronto",
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-7 w-7 text-primary-600" />
            <span className="font-semibold text-gray-900">KlaraMD Provider</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{provider?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-900">Today — {today}</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center text-gray-500">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No appointments scheduled for today.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {appointments.map(appt => (
              <Card key={appt.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{appt.patientName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {fmtTime(appt.scheduledAt)} ({appt.durationMinutes} min)
                          </span>
                          {appt.assessmentSeverity && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SEVERITY_COLOR[appt.assessmentSeverity] ?? "text-gray-600 bg-gray-100"}`}>
                              {appt.assessmentSeverity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {appt.videoRoomUrl && (
                        <a
                          href={appt.videoRoomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          <Video className="h-4 w-4 mr-1" /> Join
                        </a>
                      )}
                      <Link
                        href={`/provider/appointments/${appt.id}`}
                        className={cn(buttonVariants({ size: "sm" }))}
                      >
                        View <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
