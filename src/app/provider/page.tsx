"use client";

import { useState } from "react";
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
  Users,
  ChevronRight,
  Bell,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

const todayAppointments = [
  {
    id: 1,
    patient: "John Doe",
    time: "9:00 AM",
    status: "completed",
    type: "Follow-up",
    ohip: true,
  },
  {
    id: 2,
    patient: "Jane Smith",
    time: "10:30 AM",
    status: "in-progress",
    type: "New Patient",
    ohip: true,
  },
  {
    id: 3,
    patient: "Robert Wilson",
    time: "11:00 AM",
    status: "waiting",
    type: "Follow-up",
    ohip: false,
  },
  {
    id: 4,
    patient: "Emily Brown",
    time: "2:00 PM",
    status: "scheduled",
    type: "New Patient",
    ohip: true,
  },
  {
    id: 5,
    patient: "Michael Lee",
    time: "3:30 PM",
    status: "scheduled",
    type: "Follow-up",
    ohip: true,
  },
];

const patientQueue = [
  {
    id: 2,
    patient: "Jane Smith",
    waitTime: "5 min",
    reason: "New dry eye assessment",
    severity: "Moderate",
    hasQuestionnaire: true,
    hasImages: true,
  },
  {
    id: 3,
    patient: "Robert Wilson",
    waitTime: "2 min",
    reason: "Follow-up on Restasis",
    severity: "Mild",
    hasQuestionnaire: true,
    hasImages: false,
  },
];

const stats = {
  todayPatients: 5,
  completedToday: 1,
  ohipBilled: 850,
  privateBilled: 150,
};

type AppointmentStatus = "completed" | "in-progress" | "waiting" | "scheduled";
type Severity = "Mild" | "Moderate" | "Severe";

const statusColors: Record<AppointmentStatus, string> = {
  completed: "bg-green-100 text-green-700",
  "in-progress": "bg-blue-100 text-blue-700",
  waiting: "bg-amber-100 text-amber-700",
  scheduled: "bg-gray-100 text-gray-700",
};

const severityColors: Record<Severity, string> = {
  Mild: "text-green-600",
  Moderate: "text-amber-600",
  Severe: "text-red-600",
};

export default function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState<"queue" | "schedule">("queue");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Eye className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-semibold text-primary-900">
                  Klara
                </span>
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
                  <div className="text-gray-500 text-xs">Ophthalmologist • CPSO #12345</div>
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
                  <Link
                    href="/provider"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-50 text-primary-700 font-medium"
                  >
                    <Users className="h-5 w-5" />
                    Patient Queue
                  </Link>
                  <Link
                    href="/provider/schedule"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <Calendar className="h-5 w-5" />
                    Schedule
                  </Link>
                  <Link
                    href="/provider/patients"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="h-5 w-5" />
                    Patient Records
                  </Link>
                  <Link
                    href="/provider/billing"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <DollarSign className="h-5 w-5" />
                    OHIP Billing
                  </Link>
                  <Link
                    href="/provider/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
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
                  <span className="text-sm text-gray-600">Patients</span>
                  <span className="font-medium">
                    {stats.completedToday}/{stats.todayPatients}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">OHIP Billed</span>
                  <span className="font-medium text-green-600">
                    ${stats.ohipBilled}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Private Pay</span>
                  <span className="font-medium">${stats.privateBilled}</span>
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3 space-y-6">
            <div className="flex gap-4 border-b">
              <button
                onClick={() => setActiveTab("queue")}
                className={`pb-3 px-1 font-medium ${
                  activeTab === "queue"
                    ? "border-b-2 border-primary-600 text-primary-600"
                    : "text-gray-500"
                }`}
              >
                Patient Queue ({patientQueue.length})
              </button>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`pb-3 px-1 font-medium ${
                  activeTab === "schedule"
                    ? "border-b-2 border-primary-600 text-primary-600"
                    : "text-gray-500"
                }`}
              >
                Today&apos;s Schedule
              </button>
            </div>

            {activeTab === "queue" && (
              <div className="space-y-4">
                {patientQueue.length > 0 ? (
                  patientQueue.map((patient, index) => (
                    <Card
                      key={patient.id}
                      className={index === 0 ? "border-primary-300 bg-primary-50" : ""}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  {patient.patient}
                                </h3>
                                {index === 0 && (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                    Next
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {patient.reason}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-gray-500">
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  Waiting: {patient.waitTime}
                                </span>
                                <span
                                  className={severityColors[patient.severity as Severity]}
                                >
                                  {patient.severity} severity
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                {patient.hasQuestionnaire && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Questionnaire
                                  </span>
                                )}
                                {patient.hasImages && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Images
                                  </span>
                                )}
                                {!patient.hasImages && (
                                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    No Images
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link href="/consultation">
                              <Button>
                                <Video className="h-4 w-4 mr-2" />
                                Start Consultation
                              </Button>
                            </Link>
                            <Button variant="secondary" size="sm">
                              View Intake
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-900">Queue Empty</h3>
                      <p className="text-gray-500 mt-1">
                        No patients currently waiting
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "schedule" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {new Date().toLocaleDateString("en-CA", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <div className="font-medium text-gray-900">
                              {apt.time}
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {apt.patient}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              {apt.type}
                              {apt.ohip && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                  OHIP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs px-2 py-1 rounded ${statusColors[apt.status as AppointmentStatus]}`}
                          >
                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
