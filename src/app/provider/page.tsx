"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye, Calendar, Clock, Video, FileText, User, Settings,
  LogOut, Users, ChevronRight, Bell, DollarSign, ClipboardList,
  AlertTriangle, Pill, ShoppingCart, CheckCircle, AlertCircle,
  Loader2, ArrowRight,
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
    total_score: number;
    deq5_score: number;
    deq5_positive: boolean;
    has_autoimmune: boolean;
    has_diabetes: boolean;
    has_mgd: boolean;
  } | null;
  availability: AvailabilityBlock[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROVIDERS = [
  { id: "a1b2c3d4-0001-0001-0001-000000000001", name: "Dr. Sarah Chen" },
  { id: "a1b2c3d4-0002-0002-0002-000000000002", name: "Dr. James Wilson" },
];

const severityColors: Record<string, string> = {
  mild:     "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  severe:   "bg-red-100 text-red-700",
};

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

// ─── Mock data (schedule tab) ─────────────────────────────────────────────────

const todayAppointments = [
  { id: 1, patient: "John Doe",       time: "9:00 AM",  status: "completed",   type: "Follow-up",   ohip: true },
  { id: 2, patient: "Jane Smith",     time: "10:30 AM", status: "in-progress", type: "New Patient", ohip: true },
  { id: 3, patient: "Robert Wilson",  time: "11:00 AM", status: "waiting",     type: "Follow-up",   ohip: false },
  { id: 4, patient: "Emily Brown",    time: "2:00 PM",  status: "scheduled",   type: "New Patient", ohip: true },
  { id: 5, patient: "Michael Lee",    time: "3:30 PM",  status: "scheduled",   type: "Follow-up",   ohip: true },
];

const patientAssessments = [
  { id: "PA-001", patient: "Jane Smith",    date: "Feb 14, 2026", totalScore: 22, deq5Score: 10, severity: "Moderate" as const, autoimmune: false, diabetes: false, mgd: true,  triedTreatments: true,  riskFactors: ["MGD indicators", "Prior treatments without relief"] },
  { id: "PA-002", patient: "Robert Wilson", date: "Feb 13, 2026", totalScore: 8,  deq5Score: 4,  severity: "Mild"     as const, autoimmune: false, diabetes: false, mgd: false, triedTreatments: false, riskFactors: [] },
  { id: "PA-003", patient: "Emily Brown",   date: "Feb 12, 2026", totalScore: 32, deq5Score: 14, severity: "Severe"   as const, autoimmune: true,  diabetes: true,  mgd: true,  triedTreatments: true,  riskFactors: ["Autoimmune condition", "Diabetes", "MGD indicators", "Multiple prior treatments"] },
];

const stats = { todayPatients: 5, completedToday: 1, ohipBilled: 850, privateBilled: 150 };

type AppointmentStatus = "completed" | "in-progress" | "waiting" | "scheduled";
type SeverityLabel = "Mild" | "Moderate" | "Severe";

const statusColors: Record<AppointmentStatus, string> = {
  completed: "bg-green-100 text-green-700",
  "in-progress": "bg-blue-100 text-blue-700",
  waiting: "bg-amber-100 text-amber-700",
  scheduled: "bg-gray-100 text-gray-700",
};

function generateTreatmentPlan(assessment: typeof patientAssessments[number]) {
  const tears       = PRODUCTS.filter((p) => p.category === "artificial-tears");
  const compresses  = PRODUCTS.filter((p) => p.category === "warm-compresses");
  const lidCare     = PRODUCTS.filter((p) => p.category === "lid-care");
  const supplements = PRODUCTS.filter((p) => p.category === "supplements");

  if (assessment.severity === "Mild") {
    return { otc: [...tears.slice(0, 2), ...compresses.slice(0, 1)], rx: [], proc: [], notes: ["Start with preservative-free artificial tears 4x daily and warm compresses 1-2x daily."] };
  }
  if (assessment.severity === "Moderate") {
    return { otc: [...tears.slice(0, 2), ...compresses.slice(0, 1), ...lidCare.slice(0, 1), ...supplements.slice(0, 1)], rx: PRESCRIPTION_TREATMENTS.slice(0, 2), proc: [], notes: ["Recommend combination therapy: PF tears QID, warm compresses BID, lid hygiene daily.", "Consider Rx anti-inflammatory if OTC regimen insufficient after 4-6 weeks."] };
  }
  return { otc: [...tears.slice(0, 2), ...compresses, ...lidCare.slice(0, 2), ...supplements.slice(0, 2)], rx: [...PRESCRIPTION_TREATMENTS], proc: [...PROCEDURAL_TREATMENTS], notes: ["Comprehensive treatment approach indicated. Initiate Rx anti-inflammatory therapy promptly.", "Schedule follow-up in 4 weeks."] };
}

// ─── Pending Request Card ─────────────────────────────────────────────────────

function RequestCard({ request, onBooked }: { request: ConsultationRequest; onBooked: () => void }) {
  const [selectedBlock, setSelectedBlock] = useState<AvailabilityBlock | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0].id);
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
          provider_id: selectedProvider,
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
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700 space-y-1">
            <div className="flex gap-4">
              <span>Score: <strong>{request.assessment.total_score}/36</strong></span>
              <span>DEQ-5: <strong>{request.assessment.deq5_score}/18</strong></span>
            </div>
            {(request.assessment.has_autoimmune || request.assessment.has_diabetes || request.assessment.has_mgd) && (
              <div className="flex flex-wrap gap-1 mt-1">
                {request.assessment.has_autoimmune && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Autoimmune</span>}
                {request.assessment.has_diabetes   && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Diabetes</span>}
                {request.assessment.has_mgd        && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">MGD</span>}
              </div>
            )}
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

        {/* Provider picker */}
        {selectedSlot && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Assign to:</p>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {bookError && (
          <p className="text-sm text-red-600 mb-3">{bookError}</p>
        )}

        {selectedSlot && (
          <Button onClick={handleBook} disabled={booking} className="w-full">
            {booking ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</>
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
  const [activeTab, setActiveTab] = useState<"requests" | "schedule" | "assessments">("requests");
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [bookedId, setBookedId] = useState<string | null>(null);

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

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleBooked = (requestId: string) => {
    setBookedId(requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">Dr. Sarah Chen, MD, FRCSC</div>
                  <div className="text-gray-500 text-xs">Ophthalmologist · CPSO #12345</div>
                </div>
              </div>
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
                  <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 w-full">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </nav>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Today&apos;s Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Requests</span>
                  <span className="font-medium text-amber-600">{requests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Patients Today</span>
                  <span className="font-medium">{stats.completedToday}/{stats.todayPatients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">OHIP Billed</span>
                  <span className="font-medium text-green-600">${stats.ohipBilled}</span>
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

            <div className="flex gap-4 border-b">
              <button
                onClick={() => setActiveTab("requests")}
                className={`pb-3 px-1 font-medium flex items-center gap-2 ${activeTab === "requests" ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500"}`}
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
                className={`pb-3 px-1 font-medium ${activeTab === "schedule" ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500"}`}
              >
                Today&apos;s Schedule
              </button>
              <button
                onClick={() => setActiveTab("assessments")}
                className={`pb-3 px-1 font-medium flex items-center gap-1 ${activeTab === "assessments" ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500"}`}
              >
                <ClipboardList className="h-4 w-4" />
                Patient Assessments
              </button>
            </div>

            {/* ── Pending Requests Tab ────────────────────────────── */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                {requestsLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading requests...
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
                  <CardTitle className="text-lg">
                    {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <div className="font-medium text-gray-900">{apt.time}</div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{apt.patient}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              {apt.type}
                              {apt.ohip && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">OHIP</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded ${statusColors[apt.status as AppointmentStatus]}`}>
                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </span>
                          <Link href="/consultation">
                            <Button size="sm" variant={apt.status === "in-progress" || apt.status === "waiting" ? "default" : "secondary"}>
                              <Video className="h-4 w-4 mr-1" />
                              {apt.status === "in-progress" ? "Join" : "Start"}
                            </Button>
                          </Link>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Assessments Tab ─────────────────────────────────── */}
            {activeTab === "assessments" && (
              <div className="space-y-4">
                {patientAssessments.map((assessment) => {
                  const isExpanded = expandedAssessment === assessment.id;
                  const plan = isExpanded ? generateTreatmentPlan(assessment) : null;
                  return (
                    <Card key={assessment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedAssessment(isExpanded ? null : assessment.id)}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{assessment.patient}</h3>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{assessment.date}</span>
                                <span>Score: {assessment.totalScore}/36</span>
                                <span>DEQ-5: {assessment.deq5Score}/18</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${severityColors[assessment.severity.toLowerCase()]}`}>
                              {assessment.severity}
                            </span>
                            {assessment.riskFactors.length > 0 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                            <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </div>
                        </div>

                        {isExpanded && plan && (
                          <div className="mt-6 pt-6 border-t space-y-5">
                            {assessment.riskFactors.length > 0 && (
                              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                <h4 className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" /> Risk Factors
                                </h4>
                                <ul className="space-y-1">
                                  {assessment.riskFactors.map((rf, i) => (
                                    <li key={i} className="text-sm text-amber-700 flex items-center gap-2">
                                      <span className="w-1 h-1 rounded-full bg-amber-500" />{rf}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
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
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
