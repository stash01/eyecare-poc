"use client";

import { useState, useEffect, useCallback } from "react";
import { useProviderAuth } from "@/lib/provider-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye, Calendar, Clock, Video, FileText, User, Settings,
  LogOut, Users, ChevronRight, Bell, DollarSign, ClipboardList,
  AlertTriangle, Pill, ShoppingCart, CheckCircle, AlertCircle,
  Loader2, ArrowRight, ToggleLeft, ToggleRight,
} from "lucide-react";
import Link from "next/link";
import {
  PRODUCTS,
  PRESCRIPTION_TREATMENTS,
  PROCEDURAL_TREATMENTS,
} from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailabilityBlock {
  id: string;
  available_from: string;
  available_until: string;
}

interface ConsultationRequest {
  id: string;
  status: string;
  patient_notes: string | null;
  created_at: string;
  patient: { id: string; first_name: string; last_name: string; email: string } | null;
  assessment: {
    id: string;
    severity: string;
    frequency_score: number;
    intensity_score: number;
    risk_factor_count: number;
    risk_tier: string;
  } | null;
  availability: AvailabilityBlock[];
}

interface ScheduleAppointment {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  appointmentType: string;
  status: string;
  ohipEligible: boolean;
  billingStatus: string;
  videoRoomUrl: string | null;
  patient: { first_name: string; last_name: string; email: string } | null;
}

interface DayEdit {
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { label: "Monday",    value: 1 },
  { label: "Tuesday",   value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday",  value: 4 },
  { label: "Friday",    value: 5 },
  { label: "Saturday",  value: 6 },
  { label: "Sunday",    value: 0 },
];

const severityColors: Record<string, string> = {
  mild:     "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  severe:   "bg-red-100 text-red-700",
};

const riskTierColors: Record<string, string> = {
  low:      "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  high:     "bg-red-100 text-red-700",
};

const scheduleStatusColors: Record<string, string> = {
  completed:   "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  scheduled:   "bg-gray-100 text-gray-700",
  cancelled:   "bg-red-100 text-red-700",
  no_show:     "bg-amber-100 text-amber-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBlock(from: string, until: string) {
  const f = new Date(from);
  const u = new Date(until);
  const dateStr = f.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Toronto" });
  const fromStr = f.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto" });
  const untilStr = u.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto" });
  return `${dateStr} · ${fromStr} – ${untilStr}`;
}

function generateSlotsWithinBlock(from: string, until: string, durationMin = 30): string[] {
  const slots: string[] = [];
  let cur = new Date(from).getTime();
  const end = new Date(until).getTime();
  while (cur + durationMin * 60_000 <= end) {
    slots.push(new Date(cur).toISOString());
    cur += durationMin * 60_000;
  }
  return slots;
}

function formatSlotDisplay(iso: string) {
  return new Date(iso).toLocaleTimeString("en-CA", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto",
  });
}

function formatScheduleTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-CA", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto",
  });
}

function generateTreatmentPlan(severity: string) {
  const tears       = PRODUCTS.filter((p) => p.category === "artificial-tears");
  const compresses  = PRODUCTS.filter((p) => p.category === "warm-compresses");
  const lidCare     = PRODUCTS.filter((p) => p.category === "lid-care");
  const supplements = PRODUCTS.filter((p) => p.category === "supplements");

  const s = severity.toLowerCase();
  if (s === "mild") {
    return { otc: [...tears.slice(0, 2), ...compresses.slice(0, 1)], rx: [], proc: [], notes: ["Start with preservative-free artificial tears 4x daily and warm compresses 1-2x daily."] };
  }
  if (s === "moderate") {
    return { otc: [...tears.slice(0, 2), ...compresses.slice(0, 1), ...lidCare.slice(0, 1), ...supplements.slice(0, 1)], rx: PRESCRIPTION_TREATMENTS.slice(0, 2), proc: [], notes: ["Recommend combination therapy: PF tears QID, warm compresses BID, lid hygiene daily.", "Consider Rx anti-inflammatory if OTC regimen insufficient after 4–6 weeks."] };
  }
  return { otc: [...tears.slice(0, 2), ...compresses, ...lidCare.slice(0, 2), ...supplements.slice(0, 2)], rx: [...PRESCRIPTION_TREATMENTS], proc: [...PROCEDURAL_TREATMENTS], notes: ["Comprehensive treatment approach indicated. Initiate Rx anti-inflammatory therapy promptly.", "Schedule follow-up in 4 weeks."] };
}

// ─── Pending Request Card ─────────────────────────────────────────────────────

function RequestCard({ request, providerId, onBooked }: {
  request: ConsultationRequest;
  providerId: string;
  onBooked: () => void;
}) {
  const [selectedBlock, setSelectedBlock] = useState<AvailabilityBlock | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const slots = selectedBlock
    ? generateSlotsWithinBlock(selectedBlock.available_from, selectedBlock.available_until)
    : [];

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    setBookError(null);
    try {
      const res = await fetch("/api/provider/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultation_request_id: request.id,
          provider_id: providerId,
          scheduled_at: selectedSlot,
          duration_minutes: 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookError(data.error ?? "Failed to book appointment.");
        return;
      }
      onBooked();
    } catch {
      setBookError("Network error. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Patient summary */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {request.patient
                  ? `${request.patient.first_name} ${request.patient.last_name}`
                  : "Unknown Patient"}
              </h3>
              <p className="text-sm text-gray-500">{request.patient?.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Requested {new Date(request.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          {request.assessment && (
            <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${severityColors[request.assessment.severity] ?? ""}`}>
              {request.assessment.severity}
            </span>
          )}
        </div>

        {/* Assessment summary */}
        {request.assessment && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700 space-y-1.5">
            <div className="flex flex-wrap gap-4">
              <span>Frequency: <strong>{request.assessment.frequency_score ?? "—"}/24</strong></span>
              <span>Intensity: <strong>{request.assessment.intensity_score ?? "—"}/60</strong></span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${riskTierColors[request.assessment.risk_tier] ?? ""}`}>
                {request.assessment.risk_tier} risk
              </span>
              {request.assessment.risk_factor_count > 0 && (
                <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  {request.assessment.risk_factor_count} risk factor{request.assessment.risk_factor_count !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Patient notes */}
        {request.patient_notes && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Patient Notes</p>
            <p>{request.patient_notes}</p>
          </div>
        )}

        {/* Availability blocks */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Patient Available:</p>
          {request.availability.length === 0 ? (
            <p className="text-sm text-gray-400">No availability windows provided.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {request.availability.map((block) => (
                <button
                  key={block.id}
                  onClick={() => { setSelectedBlock(block); setSelectedSlot(null); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    selectedBlock?.id === block.id
                      ? "border-primary-600 bg-primary-50 text-primary-700 font-medium"
                      : "border-gray-200 text-gray-600 hover:border-primary-300"
                  }`}
                >
                  {formatBlock(block.available_from, block.available_until)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Slot picker */}
        {selectedBlock && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Select a 30-min slot:</p>
            {slots.length === 0 ? (
              <p className="text-sm text-gray-400">No slots available in this block.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      selectedSlot === slot
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-gray-200 text-gray-600 hover:border-primary-300"
                    }`}
                  >
                    {formatSlotDisplay(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {bookError && <p className="text-sm text-red-600 mb-3">{bookError}</p>}

        {selectedSlot && (
          <Button onClick={handleBook} disabled={booking} className="w-full">
            {booking ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking…</>
            ) : (
              <><Calendar className="mr-2 h-4 w-4" /> Confirm Appointment</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function ProviderDashboard() {
  const { provider, isLoading: authLoading, logout } = useProviderAuth();

  const [activeTab, setActiveTab] = useState<"requests" | "schedule" | "assessments" | "availability">("requests");
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);

  // Requests state
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [bookedId, setBookedId] = useState<string | null>(null);

  // Schedule state
  const [schedule, setSchedule] = useState<ScheduleAppointment[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // Availability state
  const [availEdit, setAvailEdit] = useState<Record<number, DayEdit>>({});
  const [availLoading, setAvailLoading] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);
  const [availSaved, setAvailSaved] = useState(false);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/provider/requests");
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = await fetch("/api/provider/schedule");
      const data = await res.json();
      setSchedule(data.appointments ?? []);
    } catch {
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    setAvailLoading(true);
    try {
      const res = await fetch("/api/provider/availability");
      const data = await res.json();
      const initial: Record<number, DayEdit> = {};
      DAYS.forEach((d) => {
        initial[d.value] = { enabled: false, startTime: "09:00", endTime: "17:00", slotMinutes: 30 };
      });
      (data.availability ?? []).forEach((row: { day_of_week: number; start_time: string; end_time: string; slot_minutes: number }) => {
        initial[row.day_of_week] = {
          enabled: true,
          startTime: row.start_time,
          endTime: row.end_time,
          slotMinutes: row.slot_minutes,
        };
      });
      setAvailEdit(initial);
    } catch {
      // init defaults on error
      const initial: Record<number, DayEdit> = {};
      DAYS.forEach((d) => {
        initial[d.value] = { enabled: false, startTime: "09:00", endTime: "17:00", slotMinutes: 30 };
      });
      setAvailEdit(initial);
    } finally {
      setAvailLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  useEffect(() => {
    if (activeTab === "schedule" && schedule.length === 0 && !scheduleLoading) {
      loadSchedule();
    }
    if (activeTab === "availability" && Object.keys(availEdit).length === 0 && !availLoading) {
      loadAvailability();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleBooked = (requestId: string) => {
    setBookedId(requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleUpdateStatus = async (aptId: string, status: string) => {
    setStatusUpdating(aptId);
    try {
      await fetch(`/api/appointments/${aptId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setSchedule((prev) => prev.map((a) => a.id === aptId ? { ...a, status } : a));
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleSaveAvailability = async () => {
    setSavingAvail(true);
    setAvailSaved(false);
    try {
      const rows = Object.entries(availEdit)
        .filter(([, v]) => v.enabled)
        .map(([day, v]) => ({
          dayOfWeek: Number(day),
          startTime: v.startTime,
          endTime: v.endTime,
          slotMinutes: v.slotMinutes,
        }));
      await fetch("/api/provider/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: rows }),
      });
      setAvailSaved(true);
      setTimeout(() => setAvailSaved(false), 3000);
    } finally {
      setSavingAvail(false);
    }
  };

  // Derive assessments from requests that have assessment data
  const assessments = requests.filter((r) => r.assessment !== null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Eye className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
              </Link>
              <span className="text-sm bg-primary-100 text-primary-700 px-2 py-1 rounded">
                Provider Portal
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              {provider && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{provider.name}{provider.credentials ? `, ${provider.credentials}` : ""}</div>
                    <div className="text-gray-500 text-xs">{provider.email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Link href="/provider" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-50 text-primary-700 font-medium">
                    <Users className="h-5 w-5" />
                    Dashboard
                  </Link>
                  <Link href="/provider/patients" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                    <FileText className="h-5 w-5" />
                    Patient Records
                  </Link>
                  <Link href="/provider/billing" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                    <DollarSign className="h-5 w-5" />
                    OHIP Billing
                  </Link>
                  <Link href="/provider/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                  <hr className="my-2" />
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </nav>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Requests</span>
                  <span className="font-medium text-amber-600">{requests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Upcoming (7 days)</span>
                  <span className="font-medium">{schedule.length}</span>
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3 space-y-6">
            {bookedId && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Appointment booked. The patient will see it in their dashboard.
                <button onClick={() => setBookedId(null)} className="ml-auto text-green-500 hover:text-green-700">✕</button>
              </div>
            )}

            {/* Tab bar */}
            <div className="flex gap-4 border-b overflow-x-auto">
              <button
                onClick={() => setActiveTab("requests")}
                className={`pb-3 px-1 font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === "requests" ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500"}`}
              >
                <ArrowRight className="h-4 w-4" />
                Pending Requests
                {requests.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {requests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === "schedule" ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500"}`}
              >
                Schedule (7 days)
              </button>
              <button
                onClick={() => setActiveTab("assessments")}
                className={`pb-3 px-1 font-medium flex items-center gap-1 whitespace-nowrap ${activeTab === "assessments" ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500"}`}
              >
                <ClipboardList className="h-4 w-4" />
                Patient Assessments
              </button>
              <button
                onClick={() => setActiveTab("availability")}
                className={`pb-3 px-1 font-medium flex items-center gap-1 whitespace-nowrap ${activeTab === "availability" ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500"}`}
              >
                <Clock className="h-4 w-4" />
                Availability
              </button>
            </div>

            {/* ── Pending Requests Tab ────────────────────────────── */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                {requestsLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading requests…
                  </div>
                ) : requests.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-900">No Pending Requests</h3>
                      <p className="text-gray-500 mt-1">All consultation requests have been handled</p>
                    </CardContent>
                  </Card>
                ) : (
                  requests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      providerId={provider?.id ?? ""}
                      onBooked={() => handleBooked(request.id)}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── Schedule Tab ────────────────────────────────────── */}
            {activeTab === "schedule" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })} + 7 days
                    </CardTitle>
                    <Button variant="secondary" size="sm" onClick={loadSchedule} disabled={scheduleLoading}>
                      {scheduleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {scheduleLoading ? (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading schedule…
                    </div>
                  ) : schedule.length === 0 ? (
                    <div className="py-10 text-center text-gray-400">No appointments in the next 7 days.</div>
                  ) : (
                    <div className="space-y-3">
                      {schedule.map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[70px]">
                              <div className="font-medium text-gray-900 text-sm">{formatScheduleTime(apt.scheduledAt)}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(apt.scheduledAt).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Toronto" })}
                              </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {apt.patient
                                  ? `${apt.patient.first_name} ${apt.patient.last_name}`
                                  : "Unknown Patient"}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                {apt.appointmentType.replace("_", " ")}
                                {apt.ohipEligible && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">OHIP</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${scheduleStatusColors[apt.status] ?? "bg-gray-100 text-gray-700"}`}>
                              {apt.status.replace("_", " ")}
                            </span>
                            {apt.status === "scheduled" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={!!statusUpdating}
                                  onClick={() => handleUpdateStatus(apt.id, "completed")}
                                  className="text-xs"
                                >
                                  {statusUpdating === apt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Complete"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={!!statusUpdating}
                                  onClick={() => handleUpdateStatus(apt.id, "no_show")}
                                  className="text-xs text-amber-600 hover:bg-amber-50"
                                >
                                  No-show
                                </Button>
                              </>
                            )}
                            {apt.videoRoomUrl && (
                              <Link href={`/consultation?appointment_id=${apt.id}`}>
                                <Button size="sm" variant={apt.status === "in_progress" ? "default" : "secondary"}>
                                  <Video className="h-4 w-4 mr-1" />
                                  {apt.status === "in_progress" ? "Join" : "Start"}
                                </Button>
                              </Link>
                            )}
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Assessments Tab ─────────────────────────────────── */}
            {activeTab === "assessments" && (
              <div className="space-y-4">
                {requestsLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
                  </div>
                ) : assessments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-900">No Assessments</h3>
                      <p className="text-gray-500 mt-1">Assessments will appear here from pending consultation requests</p>
                    </CardContent>
                  </Card>
                ) : (
                  assessments.map((req) => {
                    const assessment = req.assessment!;
                    const isExpanded = expandedAssessment === req.id;
                    const plan = isExpanded ? generateTreatmentPlan(assessment.severity) : null;
                    return (
                      <Card key={req.id}>
                        <CardContent className="pt-6">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedAssessment(isExpanded ? null : req.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {req.patient ? `${req.patient.first_name} ${req.patient.last_name}` : "Unknown"}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span>{new Date(req.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
                                  <span>Freq: {assessment.frequency_score}/24</span>
                                  <span>Int: {assessment.intensity_score}/60</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${severityColors[assessment.severity] ?? ""}`}>
                                {assessment.severity}
                              </span>
                              <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${riskTierColors[assessment.risk_tier] ?? ""}`}>
                                {assessment.risk_tier} risk
                              </span>
                              {assessment.risk_factor_count > 0 && (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              )}
                              <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </div>
                          </div>

                          {isExpanded && plan && (
                            <div className="mt-6 pt-6 border-t space-y-5">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary-600" /> Auto-Generated Treatment Plan
                                </h4>
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                                  <h5 className="font-medium text-blue-800 text-sm mb-2">Clinical Notes</h5>
                                  <ul className="space-y-2">
                                    {plan.notes.map((note, i) => <li key={i} className="text-sm text-blue-700">{note}</li>)}
                                  </ul>
                                </div>
                                <div className="mb-4">
                                  <h5 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 text-gray-500" /> OTC Recommendations
                                  </h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {plan.otc.map((product) => (
                                      <div key={product.id} className="p-2 border rounded text-sm">
                                        <div className="font-medium text-gray-900">{product.name}</div>
                                        <div className="text-xs text-gray-500">{product.description}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {plan.rx.length > 0 && (
                                  <div className="mb-4">
                                    <h5 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-2">
                                      <Pill className="h-4 w-4 text-gray-500" /> Prescription Suggestions
                                    </h5>
                                    <div className="space-y-2">
                                      {plan.rx.map((rx, i) => (
                                        <div key={i} className="p-2 border rounded text-sm">
                                          <div className="font-medium text-gray-900">{rx.name}</div>
                                          <div className="text-xs text-gray-500">{rx.description}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {plan.proc.length > 0 && (
                                  <div>
                                    <h5 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4 text-gray-500" /> Procedural Treatments
                                    </h5>
                                    <div className="space-y-2">
                                      {plan.proc.map((proc, i) => (
                                        <div key={i} className="p-2 border rounded text-sm">
                                          <div className="font-medium text-gray-900">{proc.name}</div>
                                          <div className="text-xs text-gray-500">{proc.description}</div>
                                          <div className="text-xs text-primary-600 italic mt-1">{proc.clinicalNote}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Availability Tab ─────────────────────────────────── */}
            {activeTab === "availability" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Weekly Availability</CardTitle>
                    <Button onClick={handleSaveAvailability} disabled={savingAvail || availLoading}>
                      {savingAvail ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                      ) : availSaved ? (
                        <><CheckCircle className="mr-2 h-4 w-4" /> Saved</>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {availLoading ? (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading availability…
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {DAYS.map((day) => {
                        const edit = availEdit[day.value] ?? { enabled: false, startTime: "09:00", endTime: "17:00", slotMinutes: 30 };
                        const update = (patch: Partial<DayEdit>) =>
                          setAvailEdit((prev) => ({ ...prev, [day.value]: { ...edit, ...patch } }));
                        return (
                          <div key={day.value} className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${edit.enabled ? "border-primary-200 bg-primary-50/30" : "border-gray-100 bg-gray-50"}`}>
                            <div className="w-28 flex-shrink-0">
                              <span className="font-medium text-gray-900 text-sm">{day.label}</span>
                            </div>
                            <button
                              onClick={() => update({ enabled: !edit.enabled })}
                              className="flex-shrink-0"
                            >
                              {edit.enabled
                                ? <ToggleRight className="h-7 w-7 text-primary-600" />
                                : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                            </button>
                            {edit.enabled ? (
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-500">From</label>
                                  <input
                                    type="time"
                                    value={edit.startTime}
                                    onChange={(e) => update({ startTime: e.target.value })}
                                    className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-500">To</label>
                                  <input
                                    type="time"
                                    value={edit.endTime}
                                    onChange={(e) => update({ endTime: e.target.value })}
                                    className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-500">Slot</label>
                                  <select
                                    value={edit.slotMinutes}
                                    onChange={(e) => update({ slotMinutes: Number(e.target.value) })}
                                    className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  >
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>60 min</option>
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Unavailable</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
