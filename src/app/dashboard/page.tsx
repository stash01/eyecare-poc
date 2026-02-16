"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  Calendar,
  Clock,
  Video,
  FileText,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Pill,
  Loader2,
  BookOpen,
  Activity,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { SymptomHistoryWidget } from "@/components/symptom-history-widget";
import { useSymptomHistory } from "@/lib/symptom-history-context";

const upcomingAppointment = {
  id: "APT-2024-001234",
  provider: "Dr. Sarah Chen",
  credentials: "MD, FRCSC",
  date: "Monday, Feb 5, 2024",
  time: "10:30 AM",
  isJoinable: true,
};

const pastAppointments = [
  {
    id: "APT-2024-001200",
    provider: "Dr. Sarah Chen",
    credentials: "MD, FRCSC",
    date: "Jan 15, 2024",
    status: "Completed",
    hasNotes: true,
    hasPrescription: true,
  },
  {
    id: "APT-2024-001150",
    provider: "Dr. James Wilson",
    credentials: "MD, FRCSC",
    date: "Dec 20, 2023",
    status: "Completed",
    hasNotes: true,
    hasPrescription: false,
  },
];

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

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { history } = useSymptomHistory();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const firstName = user?.firstName || "User";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-sm font-medium">{firstName} {user?.lastName?.charAt(0) || ""}.</span>
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
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-50 text-primary-700 font-medium"
                  >
                    <Calendar className="h-5 w-5" />
                    Dashboard
                  </Link>
                  <Link
                    href="/blog"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <BookOpen className="h-5 w-5" />
                    Blog &amp; Community
                  </Link>
                  <Link
                    href="/dashboard/symptom-tracker"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <Activity className="h-5 w-5" />
                    Symptom Tracker
                  </Link>
                  <Link
                    href="/dashboard/records"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="h-5 w-5" />
                    Medical Records
                  </Link>
                  <Link
                    href="/dashboard/prescriptions"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <Pill className="h-5 w-5" />
                    Prescriptions
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </nav>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {firstName}
              </h1>
              <p className="text-gray-600">
                We&apos;re here to support you on your journey to healthier eyes
              </p>
            </div>

            {/* 3 Pathway Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/blog">
                <Card className="hover:border-primary-300 cursor-pointer transition-colors h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                        <BookOpen className="h-7 w-7 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Blog &amp; Community</div>
                        <p className="text-sm text-gray-500 mt-1">
                          Articles, tips, and community stories
                        </p>
                      </div>
                      <span className="text-xs text-primary-600 flex items-center gap-1">
                        Explore <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/symptom-tracker">
                <Card className="hover:border-primary-300 cursor-pointer transition-colors h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                        <Activity className="h-7 w-7 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Symptom Tracker</div>
                        <p className="text-sm text-gray-500 mt-1">
                          {history.length > 0
                            ? `${history.length} assessment${history.length > 1 ? "s" : ""} recorded`
                            : "Track your symptoms over time"}
                        </p>
                      </div>
                      <span className="text-xs text-primary-600 flex items-center gap-1">
                        View History <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/assessment">
                <Card className="hover:border-primary-300 cursor-pointer transition-colors h-full border-primary-200 bg-primary-50">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                        <ClipboardList className="h-7 w-7 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {history.length > 0 ? "Retake Assessment" : "Take Assessment"}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Clinically validated dry eye assessment
                        </p>
                      </div>
                      <span className="text-xs text-primary-600 flex items-center gap-1">
                        Start Now <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Symptom History Widget */}
            <SymptomHistoryWidget />

            {/* Secondary content: Appointments & Prescriptions */}
            {upcomingAppointment && (
              <Card className="border-primary-200 bg-primary-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary-600" />
                    Upcoming Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {upcomingAppointment.provider}
                        </div>
                        <div className="text-sm text-gray-600">
                          {upcomingAppointment.date} at {upcomingAppointment.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {upcomingAppointment.isJoinable ? (
                        <Link href="/consultation">
                          <Button>
                            <Video className="h-4 w-4 mr-2" />
                            Join Now
                          </Button>
                        </Link>
                      ) : (
                        <Button disabled>
                          <Video className="h-4 w-4 mr-2" />
                          Join (Available 15 min before)
                        </Button>
                      )}
                      <Button variant="secondary">Reschedule</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Past Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {apt.provider}
                          </div>
                          <div className="text-sm text-gray-500">
                            {apt.credentials} &bull; {apt.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {apt.hasNotes && (
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            Notes
                          </Button>
                        )}
                        {apt.hasPrescription && (
                          <Button variant="ghost" size="sm">
                            <Pill className="h-4 w-4 mr-1" />
                            Rx
                          </Button>
                        )}
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Prescriptions</CardTitle>
              </CardHeader>
              <CardContent>
                {prescriptions.length > 0 ? (
                  <div className="space-y-4">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="p-4 rounded-lg border bg-green-50 border-green-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {rx.name}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {rx.dosage} &bull; {rx.instructions}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Prescribed: {rx.prescribedDate}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                            {rx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No active prescriptions
                  </p>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
