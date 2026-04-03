"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  Eye, Users, ClipboardList, Calendar, Video, Shield,
  ArrowLeft, Loader2, ExternalLink, AlertCircle, CheckCircle,
  UserCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminPatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  assessmentCount: number;
  latestSeverity: string | null;
}

interface AdminAssessment {
  id: string;
  patientId: string;
  patientName: string;
  severity: string;
  frequencyScore: number;
  intensityScore: number;
  riskTier: string;
  createdAt: string;
}

interface AdminAppointment {
  id: string;
  patientId: string;
  providerId: string;
  patientName: string;
  providerName: string;
  scheduledAt: string;
  appointmentType: string;
  status: string;
  videoRoomUrl: string | null;
}

interface Provider {
  id: string;
  name: string;
  credentials: string;
  specialty: string;
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const severityColors: Record<string, string> = {
  mild:     "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  severe:   "bg-red-100 text-red-700",
};

const riskColors: Record<string, string> = {
  low:      "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  high:     "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  scheduled:   "bg-blue-100 text-blue-700",
  completed:   "bg-green-100 text-green-700",
  cancelled:   "bg-stone-100 text-stone-600",
  no_show:     "bg-amber-100 text-amber-700",
  in_progress: "bg-purple-100 text-purple-700",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short", day: "numeric", year: "numeric",
    timeZone: "America/Toronto",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    hour12: true, timeZone: "America/Toronto",
  });
}

function generateSlots(from: string, until: string, durMin = 30): string[] {
  const slots: string[] = [];
  let cur = new Date(from).getTime();
  const end = new Date(until).getTime();
  while (cur + durMin * 60_000 <= end) {
    slots.push(new Date(cur).toISOString());
    cur += durMin * 60_000;
  }
  return slots;
}

function fmtSlot(iso: string) {
  return new Date(iso).toLocaleTimeString("en-CA", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto",
  });
}

function fmtBlock(from: string, until: string) {
  const f = new Date(from);
  const u = new Date(until);
  const date = f.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Toronto" });
  const fromT = f.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto" });
  const untilT = u.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto" });
  return `${date} · ${fromT}–${untilT}`;
}

// ─── Request Card (admin version with provider picker) ────────────────────────

function AdminRequestCard({
  request,
  providers,
  onBooked,
}: {
  request: ConsultationRequest;
  providers: Provider[];
  onBooked: () => void;
}) {
  const [selectedBlock, setSelectedBlock] = useState<AvailabilityBlock | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState(providers[0]?.id ?? "");
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const slots = selectedBlock ? generateSlots(selectedBlock.available_from, selectedBlock.available_until) : [];

  const handleBook = async () => {
    if (!selectedSlot || !selectedProvider) return;
    setBooking(true);
    setBookError(null);
    try {
      const res = await fetch("/api/admin/appointments", {
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
      if (!res.ok) { setBookError(data.error ?? "Failed to book"); return; }
      onBooked();
    } catch {
      setBookError("Network error. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-stone-500" />
            </div>
            <div>
              <div className="font-semibold text-stone-900">
                {request.patient ? `${request.patient.first_name} ${request.patient.last_name}` : "Unknown"}
              </div>
              <div className="text-sm text-stone-500">{request.patient?.email}</div>
              <div className="text-xs text-stone-400 mt-0.5">
                Requested {fmtDate(request.created_at)}
              </div>
            </div>
          </div>
          {request.assessment && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${severityColors[request.assessment.severity] ?? ""}`}>
              {request.assessment.severity}
            </span>
          )}
        </div>

        {request.assessment && (
          <div className="bg-stone-50 rounded-lg p-3 mb-4 text-sm text-stone-700 flex flex-wrap gap-3">
            <span>Freq: <strong>{request.assessment.frequency_score ?? "—"}/24</strong></span>
            <span>Int: <strong>{request.assessment.intensity_score ?? "—"}/60</strong></span>
            <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${riskColors[request.assessment.risk_tier] ?? ""}`}>
              {request.assessment.risk_tier} risk
            </span>
          </div>
        )}

        {request.patient_notes && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-800">
            <p className="font-medium mb-0.5">Patient Notes</p>
            <p>{request.patient_notes}</p>
          </div>
        )}

        {/* Availability blocks */}
        <div className="mb-4">
          <p className="text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">Patient Available</p>
          {request.availability.length === 0 ? (
            <p className="text-sm text-stone-400">No availability windows provided.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {request.availability.map((block) => (
                <button
                  key={block.id}
                  onClick={() => { setSelectedBlock(block); setSelectedSlot(null); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    selectedBlock?.id === block.id
                      ? "border-primary-600 bg-primary-50 text-primary-700 font-medium"
                      : "border-stone-200 text-stone-600 hover:border-primary-300"
                  }`}
                >
                  {fmtBlock(block.available_from, block.available_until)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Slot picker */}
        {selectedBlock && (
          <div className="mb-4">
            <p className="text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">Select Slot (30 min)</p>
            {slots.length === 0 ? (
              <p className="text-sm text-stone-400">No slots in this window.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      selectedSlot === slot
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-stone-200 text-stone-600 hover:border-primary-300"
                    }`}
                  >
                    {fmtSlot(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Provider picker */}
        {selectedSlot && (
          <div className="mb-4">
            <p className="text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">Assign to Provider</p>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full max-w-xs"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.credentials ? `, ${p.credentials}` : ""}</option>
              ))}
            </select>
          </div>
        )}

        {bookError && <p className="text-sm text-red-600 mb-3">{bookError}</p>}

        {selectedSlot && (
          <Button onClick={handleBook} disabled={booking || !selectedProvider} className="w-full">
            {booking ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking…</>
            ) : (
              <><Calendar className="mr-2 h-4 w-4" /> Confirm &amp; Assign</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"patients" | "assessments" | "appointments" | "schedule">("patients");

  // Overview data
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [assessments, setAssessments] = useState<AdminAssessment[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Schedule tab data
  const [pendingRequests, setPendingRequests] = useState<ConsultationRequest[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [bookedId, setBookedId] = useState<string | null>(null);

  // Reassignment state
  const [providerChanges, setProviderChanges] = useState<Record<string, string>>({});
  const [savingReassign, setSavingReassign] = useState<string | null>(null);
  const [reassignSuccess, setReassignSuccess] = useState<string | null>(null);

  // Meeting state
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) router.push("/dashboard");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((data) => {
        setPatients(data.patients ?? []);
        setAssessments(data.assessments ?? []);
        setAppointments(data.appointments ?? []);
        setProviders(data.providers ?? []);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [user?.isAdmin]);

  const loadPendingRequests = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = await fetch("/api/admin/requests");
      const data = await res.json();
      setPendingRequests(data.requests ?? []);
    } catch {
      setPendingRequests([]);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "schedule" && pendingRequests.length === 0 && !scheduleLoading) {
      loadPendingRequests();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleBooked = (requestId: string) => {
    setBookedId(requestId);
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    // Refresh appointments list
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((data) => setAppointments(data.appointments ?? []))
      .catch(() => {});
  };

  const handleReassign = async (appointmentId: string) => {
    const newProviderId = providerChanges[appointmentId];
    if (!newProviderId) return;
    setSavingReassign(appointmentId);
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}/provider`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: newProviderId }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? { ...a, providerId: newProviderId, providerName: data.providerName }
            : a
        )
      );
      setProviderChanges((prev) => { const next = { ...prev }; delete next[appointmentId]; return next; });
      setReassignSuccess(appointmentId);
      setTimeout(() => setReassignSuccess(null), 2500);
    } finally {
      setSavingReassign(null);
    }
  };

  const handleStartMeeting = async () => {
    setMeetingLoading(true);
    setMeetingError(null);
    try {
      const res = await fetch("/api/admin/meeting", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setMeetingError(data.error ?? "Failed to create room"); return; }
      if (!data.url) { setMeetingError(data.message ?? "DAILY_API_KEY not configured"); return; }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setMeetingError("Network error — try again");
    } finally {
      setMeetingLoading(false);
    }
  };

  // Sort appointments by scheduled_at ascending for schedule view
  const upcomingAppointments = [...appointments]
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  if (authLoading || (!user?.isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const overviewTabs = [
    { id: "patients" as const,     label: "Patients",     icon: Users,         count: patients.length },
    { id: "assessments" as const,  label: "Assessments",  icon: ClipboardList, count: assessments.length },
    { id: "appointments" as const, label: "Appointments", icon: Calendar,      count: appointments.length },
    { id: "schedule" as const,     label: "Schedule",     icon: UserCheck,     count: pendingRequests.length },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-sm">
        <div className="container mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Dashboard</span>
              </Link>
              <span className="text-stone-300">/</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-stone-900">Admin Panel</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/assessment">
                <Button variant="secondary" size="sm" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Take Assessment
                </Button>
              </Link>
              <Button size="sm" onClick={handleStartMeeting} disabled={meetingLoading} className="gap-2 bg-primary-600 hover:bg-primary-700">
                {meetingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                Start Meeting
              </Button>
            </div>
          </div>
          {meetingError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {meetingError}
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">

        {/* Stat cards / tab switchers */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {overviewTabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`p-5 rounded-2xl border text-left transition-all ${
                activeTab === id
                  ? "border-primary-200 bg-white shadow-md"
                  : "border-stone-200 bg-white/60 hover:bg-white hover:shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${activeTab === id ? "bg-primary-100" : "bg-stone-100"}`}>
                <Icon className={`h-5 w-5 ${activeTab === id ? "text-primary-600" : "text-stone-500"}`} />
              </div>
              <div className={`text-2xl font-bold mb-0.5 ${activeTab === id ? "text-primary-900" : "text-stone-800"}`}>
                {dataLoading && id !== "schedule" ? "—" : count}
              </div>
              <div className="text-sm text-stone-500">{label}</div>
              {id === "schedule" && count > 0 && (
                <div className="text-xs text-amber-600 font-medium mt-0.5">{count} pending</div>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────── */}
        {dataLoading && activeTab !== "schedule" ? (
          <Card>
            <CardContent className="py-16 flex items-center justify-center text-stone-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />Loading data…
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Patients ──────────────────────────────────────── */}
            {activeTab === "patients" && (
              <Card>
                <CardHeader><CardTitle className="text-base">All Patients</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {patients.length === 0 ? (
                    <div className="py-12 text-center text-stone-400">No patients yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-stone-100 text-left text-xs text-stone-400 uppercase tracking-wide">
                            <th className="px-6 py-3 font-medium">Name</th>
                            <th className="px-6 py-3 font-medium">Email</th>
                            <th className="px-6 py-3 font-medium">Joined</th>
                            <th className="px-6 py-3 font-medium">Assessments</th>
                            <th className="px-6 py-3 font-medium">Latest Severity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                          {patients.map((p) => (
                            <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-6 py-3.5 font-medium text-stone-900">{p.firstName} {p.lastName}</td>
                              <td className="px-6 py-3.5 text-stone-500">{p.email}</td>
                              <td className="px-6 py-3.5 text-stone-500">{fmtDate(p.createdAt)}</td>
                              <td className="px-6 py-3.5 font-medium">{p.assessmentCount}</td>
                              <td className="px-6 py-3.5">
                                {p.latestSeverity ? (
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${severityColors[p.latestSeverity] ?? "bg-stone-100 text-stone-600"}`}>
                                    {p.latestSeverity}
                                  </span>
                                ) : <span className="text-stone-300 text-xs">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Assessments ───────────────────────────────────── */}
            {activeTab === "assessments" && (
              <Card>
                <CardHeader><CardTitle className="text-base">All Assessments</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {assessments.length === 0 ? (
                    <div className="py-12 text-center text-stone-400">No assessments yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-stone-100 text-left text-xs text-stone-400 uppercase tracking-wide">
                            <th className="px-6 py-3 font-medium">Patient</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Severity</th>
                            <th className="px-6 py-3 font-medium">Frequency</th>
                            <th className="px-6 py-3 font-medium">Intensity</th>
                            <th className="px-6 py-3 font-medium">Risk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                          {assessments.map((a) => (
                            <tr key={a.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-6 py-3.5 font-medium text-stone-900">{a.patientName}</td>
                              <td className="px-6 py-3.5 text-stone-500">{fmtDate(a.createdAt)}</td>
                              <td className="px-6 py-3.5">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${severityColors[a.severity] ?? "bg-stone-100 text-stone-600"}`}>
                                  {a.severity}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-stone-700">
                                <strong>{a.frequencyScore ?? "—"}</strong><span className="text-stone-400">/24</span>
                              </td>
                              <td className="px-6 py-3.5 text-stone-700">
                                <strong>{a.intensityScore ?? "—"}</strong><span className="text-stone-400">/60</span>
                              </td>
                              <td className="px-6 py-3.5">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${riskColors[a.riskTier] ?? "bg-stone-100 text-stone-600"}`}>
                                  {a.riskTier}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Appointments (read-only log) ───────────────────── */}
            {activeTab === "appointments" && (
              <Card>
                <CardHeader><CardTitle className="text-base">All Appointments</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {appointments.length === 0 ? (
                    <div className="py-12 text-center text-stone-400">No appointments yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-stone-100 text-left text-xs text-stone-400 uppercase tracking-wide">
                            <th className="px-6 py-3 font-medium">Patient</th>
                            <th className="px-6 py-3 font-medium">Provider</th>
                            <th className="px-6 py-3 font-medium">Scheduled</th>
                            <th className="px-6 py-3 font-medium">Type</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Video</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                          {appointments.map((a) => (
                            <tr key={a.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-6 py-3.5 font-medium text-stone-900">{a.patientName}</td>
                              <td className="px-6 py-3.5 text-stone-500">{a.providerName}</td>
                              <td className="px-6 py-3.5 text-stone-500">{fmtDateTime(a.scheduledAt)}</td>
                              <td className="px-6 py-3.5 text-stone-600 capitalize">{a.appointmentType.replace("_", " ")}</td>
                              <td className="px-6 py-3.5">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[a.status] ?? "bg-stone-100 text-stone-600"}`}>
                                  {a.status.replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-6 py-3.5">
                                {a.videoRoomUrl ? (
                                  <a href={a.videoRoomUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-xs">
                                    <Video className="h-3.5 w-3.5" /> Join <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : <span className="text-stone-300 text-xs">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Schedule (assign + reassign) ──────────────────── */}
            {activeTab === "schedule" && (
              <div className="space-y-6">

                {/* Success banner */}
                {bookedId && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    Appointment booked and assigned. The patient will see it in their dashboard.
                    <button onClick={() => setBookedId(null)} className="ml-auto text-green-500 hover:text-green-700">✕</button>
                  </div>
                )}

                {/* ── Pending Requests ──────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      Pending Consultation Requests
                      {pendingRequests.length > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {pendingRequests.length}
                        </span>
                      )}
                    </h2>
                    <Button variant="secondary" size="sm" onClick={loadPendingRequests} disabled={scheduleLoading}>
                      {scheduleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                    </Button>
                  </div>

                  {scheduleLoading ? (
                    <div className="flex items-center justify-center py-10 text-stone-400">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading requests…
                    </div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-stone-100 bg-white text-center text-stone-400 text-sm">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
                      No pending requests
                    </div>
                  ) : providers.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-amber-100 bg-amber-50 text-center text-amber-700 text-sm">
                      No active providers found — add providers before assigning consultations.
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {pendingRequests.map((req) => (
                        <AdminRequestCard
                          key={req.id}
                          request={req}
                          providers={providers}
                          onBooked={() => handleBooked(req.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-stone-100" />

                {/* ── Master Schedule ───────────────────────────── */}
                <div>
                  <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    Master Schedule
                  </h2>

                  {upcomingAppointments.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-stone-100 bg-white text-center text-stone-400 text-sm">
                      No scheduled appointments yet.
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-stone-100 text-left text-xs text-stone-400 uppercase tracking-wide">
                                <th className="px-5 py-3 font-medium">Date / Time</th>
                                <th className="px-5 py-3 font-medium">Patient</th>
                                <th className="px-5 py-3 font-medium">Provider</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                                <th className="px-5 py-3 font-medium">Reassign</th>
                                <th className="px-5 py-3 font-medium">Video</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                              {upcomingAppointments.map((apt) => {
                                const pendingChange = providerChanges[apt.id];
                                const isDirty = !!pendingChange && pendingChange !== apt.providerId;
                                return (
                                  <tr key={apt.id} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="px-5 py-3.5 text-stone-700 whitespace-nowrap">
                                      {fmtDateTime(apt.scheduledAt)}
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-stone-900">{apt.patientName}</td>
                                    <td className="px-5 py-3.5 text-stone-500">
                                      {reassignSuccess === apt.id ? (
                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                          <CheckCircle className="h-3.5 w-3.5" /> {apt.providerName}
                                        </span>
                                      ) : (
                                        apt.providerName
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[apt.status] ?? "bg-stone-100 text-stone-600"}`}>
                                        {apt.status.replace("_", " ")}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <div className="flex items-center gap-2">
                                        <select
                                          value={pendingChange ?? apt.providerId}
                                          onChange={(e) =>
                                            setProviderChanges((prev) => ({ ...prev, [apt.id]: e.target.value }))
                                          }
                                          className="border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                          {providers.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                          ))}
                                        </select>
                                        {isDirty && (
                                          <Button
                                            size="sm"
                                            disabled={savingReassign === apt.id}
                                            onClick={() => handleReassign(apt.id)}
                                            className="text-xs h-7 px-2"
                                          >
                                            {savingReassign === apt.id
                                              ? <Loader2 className="h-3 w-3 animate-spin" />
                                              : "Save"}
                                          </Button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      {apt.videoRoomUrl ? (
                                        <a href={apt.videoRoomUrl} target="_blank" rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-xs">
                                          <Video className="h-3.5 w-3.5" /> Join <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : <span className="text-stone-300 text-xs">—</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
