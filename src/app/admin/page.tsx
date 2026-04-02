"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  Eye, Users, ClipboardList, Calendar, Video, Shield,
  ArrowLeft, Loader2, ExternalLink, AlertCircle, CheckCircle,
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
  patientName: string;
  providerName: string;
  scheduledAt: string;
  appointmentType: string;
  status: string;
  videoRoomUrl: string | null;
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"patients" | "assessments" | "appointments">("patients");
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [assessments, setAssessments] = useState<AdminAssessment[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((data) => {
        setPatients(data.patients ?? []);
        setAssessments(data.assessments ?? []);
        setAppointments(data.appointments ?? []);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [user?.isAdmin]);

  const handleStartMeeting = async () => {
    setMeetingLoading(true);
    setMeetingError(null);
    try {
      const res = await fetch("/api/admin/meeting", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMeetingError(data.error ?? "Failed to create room");
        return;
      }
      if (!data.url) {
        setMeetingError(data.message ?? "DAILY_API_KEY not configured");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setMeetingError("Network error — try again");
    } finally {
      setMeetingLoading(false);
    }
  };

  if (authLoading || (!user?.isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const tabs = [
    { id: "patients" as const,     label: "Patients",     icon: Users,         count: patients.length },
    { id: "assessments" as const,  label: "Assessments",  icon: ClipboardList, count: assessments.length },
    { id: "appointments" as const, label: "Appointments", icon: Calendar,      count: appointments.length },
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
              <Button
                size="sm"
                onClick={handleStartMeeting}
                disabled={meetingLoading}
                className="gap-2 bg-primary-600 hover:bg-primary-700"
              >
                {meetingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {tabs.map(({ id, label, icon: Icon, count }) => (
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
                {dataLoading ? "—" : count}
              </div>
              <div className="text-sm text-stone-500">{label}</div>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {dataLoading ? (
          <Card>
            <CardContent className="py-16 flex items-center justify-center text-stone-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading data…
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Patients ──────────────────────────────────────── */}
            {activeTab === "patients" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">All Patients</CardTitle>
                </CardHeader>
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
                              <td className="px-6 py-3.5 font-medium text-stone-900">
                                {p.firstName} {p.lastName}
                              </td>
                              <td className="px-6 py-3.5 text-stone-500">{p.email}</td>
                              <td className="px-6 py-3.5 text-stone-500">{fmtDate(p.createdAt)}</td>
                              <td className="px-6 py-3.5 text-stone-700 font-medium">{p.assessmentCount}</td>
                              <td className="px-6 py-3.5">
                                {p.latestSeverity ? (
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${severityColors[p.latestSeverity] ?? "bg-stone-100 text-stone-600"}`}>
                                    {p.latestSeverity}
                                  </span>
                                ) : (
                                  <span className="text-stone-300 text-xs">—</span>
                                )}
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
                <CardHeader>
                  <CardTitle className="text-base">All Assessments</CardTitle>
                </CardHeader>
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
                                <span className="font-medium">{a.frequencyScore ?? "—"}</span>
                                <span className="text-stone-400">/24</span>
                              </td>
                              <td className="px-6 py-3.5 text-stone-700">
                                <span className="font-medium">{a.intensityScore ?? "—"}</span>
                                <span className="text-stone-400">/60</span>
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

            {/* ── Appointments ──────────────────────────────────── */}
            {activeTab === "appointments" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">All Appointments</CardTitle>
                </CardHeader>
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
                              <td className="px-6 py-3.5 text-stone-600 capitalize">
                                {a.appointmentType.replace("_", " ")}
                              </td>
                              <td className="px-6 py-3.5">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[a.status] ?? "bg-stone-100 text-stone-600"}`}>
                                  {a.status.replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-6 py-3.5">
                                {a.videoRoomUrl ? (
                                  <a
                                    href={a.videoRoomUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-xs"
                                  >
                                    <Video className="h-3.5 w-3.5" />
                                    Join
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <span className="text-stone-300 text-xs">—</span>
                                )}
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
          </>
        )}
      </div>
    </div>
  );
}
