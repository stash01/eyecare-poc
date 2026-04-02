"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye, Calendar, Clock, Video, FileText, User, Settings,
  LogOut, ChevronRight, Bell, Pill, Loader2, BookOpen,
  Activity, ClipboardList, ArrowRight, Stethoscope, UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { SymptomHistoryWidget } from "@/components/symptom-history-widget";
import { useSymptomHistory } from "@/lib/symptom-history-context";

interface Appointment {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  appointmentType: string;
  status: string;
  videoRoomUrl: string | null;
  provider: { name: string; credentials: string; specialty: string } | null;
}

function isJoinable(apt: Appointment): boolean {
  if (apt.status === "in_progress") return true;
  if (apt.status !== "scheduled") return false;
  const msUntil = new Date(apt.scheduledAt).getTime() - Date.now();
  return msUntil <= 30 * 60_000;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    weekday: "long", month: "short", day: "numeric",
    timeZone: "America/Toronto",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-CA", {
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "America/Toronto",
  });
}

const prescriptions = [
  {
    id: 1,
    name: "Restasis (Cyclosporine)",
    dosage: "0.05%",
    instructions: "One drop in each eye, twice daily",
    prescribedDate: "Jan 15, 2024",
    status: "Active",
  },
];

const navItems = [
  { href: "/dashboard",                   icon: Calendar,      label: "Dashboard" },
  { href: "/blog",                        icon: BookOpen,      label: "Blog & Community" },
  { href: "/dashboard/symptom-tracker",   icon: Activity,      label: "Symptom Tracker" },
  { href: "/dashboard/records",           icon: FileText,      label: "Medical Records" },
  { href: "/dashboard/prescriptions",     icon: Pill,          label: "Prescriptions" },
  { href: "/dashboard/profile",           icon: User,          label: "Profile" },
  { href: "/dashboard/settings",          icon: Settings,      label: "Settings" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { history } = useSymptomHistory();
  const [upcomingApts, setUpcomingApts] = useState<Appointment[]>([]);
  const [pastApts, setPastApts] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => {
        const all: Appointment[] = data.appointments ?? [];
        setUpcomingApts(
          all.filter((a) => a.status === "scheduled" || a.status === "in_progress")
        );
        setPastApts(
          all.filter((a) => ["completed", "cancelled", "no_show"].includes(a.status))
        );
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = () => { logout(); router.push("/"); };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const firstName = user?.firstName || "there";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-sm">
        <div className="container mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Eye className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-primary-900 tracking-tight">
                Klara<span className="text-primary-500">MD</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl relative">
                <Bell className="h-5 w-5 text-stone-500" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full" />
              </Button>
              <div className="flex items-center gap-2.5 pl-3 border-l border-stone-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {firstName.charAt(0)}{user?.lastName?.charAt(0) || ""}
                  </span>
                </div>
                <span className="text-sm font-medium text-stone-700">
                  {firstName} {user?.lastName?.charAt(0) || ""}.
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <aside className="lg:col-span-1">
            <Card className="overflow-hidden">
              {/* Sidebar header */}
              <div className="bg-gradient-to-br from-primary-800 to-primary-700 p-5">
                <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-white">
                    {firstName.charAt(0)}{user?.lastName?.charAt(0) || ""}
                  </span>
                </div>
                <div className="text-white font-semibold">{firstName} {user?.lastName || ""}</div>
                <div className="text-primary-200/70 text-xs mt-0.5">{user?.email || ""}</div>
              </div>

              <CardContent className="p-3">
                <nav className="space-y-0.5">
                  {navItems.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        href === "/dashboard"
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {label}
                    </Link>
                  ))}
                  <div className="pt-1 mt-1 border-t border-stone-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:bg-red-50 hover:text-red-600 w-full transition-all"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* ── Main ─────────────────────────────────────────────── */}
          <main className="lg:col-span-3 space-y-6">

            {/* Greeting */}
            <div>
              <h1 className="font-display text-3xl text-stone-900">
                Good to see you, {firstName}
              </h1>
              <p className="text-stone-500 mt-1">Here&apos;s your eye health at a glance.</p>
            </div>

            {/* 3 Pathway Cards */}
            <div className="grid md:grid-cols-3 gap-4">

              <Link href="/blog">
                <div className="group relative p-5 rounded-2xl border border-stone-200 bg-white shadow-card hover:shadow-card-lg hover:-translate-y-0.5 transition-all h-full cursor-pointer">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center mb-4 group-hover:bg-sky-100 transition-colors">
                    <BookOpen className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="font-semibold text-stone-900 mb-1">Blog & Community</div>
                  <p className="text-xs text-stone-500 mb-4">Articles, tips, and community stories</p>
                  <span className="text-xs text-primary-600 font-medium flex items-center gap-1">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>

              <Link href="/dashboard/symptom-tracker">
                <div className="group relative p-5 rounded-2xl border border-stone-200 bg-white shadow-card hover:shadow-card-lg hover:-translate-y-0.5 transition-all h-full cursor-pointer">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="font-semibold text-stone-900 mb-1">Symptom Tracker</div>
                  <p className="text-xs text-stone-500 mb-4">
                    {history.length > 0
                      ? `${history.length} assessment${history.length > 1 ? "s" : ""} recorded`
                      : "Track your symptoms over time"}
                  </p>
                  <span className="text-xs text-primary-600 font-medium flex items-center gap-1">
                    View History <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>

              <Link href="/assessment">
                <div className="group relative p-5 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-600 to-primary-700 shadow-card hover:shadow-glow hover:-translate-y-0.5 transition-all h-full cursor-pointer">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <ClipboardList className="h-5 w-5 text-white" />
                  </div>
                  <div className="font-semibold text-white mb-1">
                    {history.length > 0 ? "Retake Assessment" : "Take Assessment"}
                  </div>
                  <p className="text-xs text-primary-200/80 mb-4">Clinically validated dry eye assessment</p>
                  <span className="text-xs text-white font-medium flex items-center gap-1">
                    Start Now <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </div>

            {/* Request Consultation CTA */}
            <Link href="/request-consultation">
              <div className="group flex items-center justify-between p-5 rounded-2xl border border-accent-200 bg-gradient-to-r from-accent-50 to-white shadow-card hover:shadow-card-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-accent-100 flex items-center justify-center group-hover:bg-accent-200 transition-colors flex-shrink-0">
                    <UserPlus className="h-5 w-5 text-accent-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">Request a Specialist Consultation</div>
                    <p className="text-xs text-stone-500 mt-0.5">Tell us when you&apos;re available — a specialist will confirm your appointment</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-accent-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Symptom History Widget */}
            <SymptomHistoryWidget />

            {/* Upcoming Appointments */}
            {upcomingApts.length > 0 && (
              <Card className="border-primary-100 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-400" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary-500" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingApts.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">
                            {apt.provider?.name ?? "Specialist"}
                          </div>
                          <div className="text-sm text-stone-500">
                            {apt.provider?.specialty ?? apt.appointmentType}
                          </div>
                          <div className="text-sm text-primary-600 font-medium mt-0.5">
                            {fmtDate(apt.scheduledAt)} · {fmtTime(apt.scheduledAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isJoinable(apt) ? (
                          <Link href={`/consultation?appointment_id=${apt.id}`}>
                            <Button size="sm" className="gap-2">
                              <Video className="h-4 w-4" />
                              Join Now
                            </Button>
                          </Link>
                        ) : (
                          <Button size="sm" disabled className="gap-2">
                            <Video className="h-4 w-4" />
                            Join (30 min before)
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Past Appointments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Past Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {pastApts.length === 0 ? (
                  <p className="text-stone-400 text-sm text-center py-6">No past appointments</p>
                ) : (
                  <div className="space-y-2">
                    {pastApts.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-stone-500" />
                          </div>
                          <div>
                            <div className="font-medium text-stone-900 text-sm">
                              {apt.provider?.name ?? "Specialist"}
                            </div>
                            <div className="text-xs text-stone-400">
                              {apt.provider?.credentials} · {fmtDate(apt.scheduledAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                            apt.status === "completed"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                              : apt.status === "cancelled"
                              ? "text-stone-500 bg-stone-50 border-stone-100"
                              : "text-amber-700 bg-amber-50 border-amber-100"
                          }`}>
                            {apt.status.replace("_", " ")}
                          </span>
                          <ChevronRight className="h-4 w-4 text-stone-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Prescriptions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary-500" />
                  Active Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prescriptions.length > 0 ? (
                  <div className="space-y-3">
                    {prescriptions.map((rx) => (
                      <div key={rx.id} className="flex items-start justify-between p-4 rounded-xl border border-stone-100 bg-stone-50">
                        <div className="flex gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <Pill className="h-4 w-4 text-primary-600" />
                          </div>
                          <div>
                            <div className="font-medium text-stone-900 text-sm">{rx.name}</div>
                            <div className="text-xs text-stone-500 mt-0.5">{rx.dosage} · {rx.instructions}</div>
                            <div className="text-xs text-stone-400 mt-1">Prescribed {rx.prescribedDate}</div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full flex-shrink-0">
                          {rx.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-400 text-sm text-center py-6">No active prescriptions</p>
                )}
              </CardContent>
            </Card>

          </main>
        </div>
      </div>
    </div>
  );
}
