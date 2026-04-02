"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Shield, AlertCircle, Loader2, Video } from "lucide-react";

interface AppointmentProvider {
  id: string;
  name: string;
  credentials: string;
  specialty: string;
  cpso_number: string;
  location: string;
  phone: string;
}

interface AppointmentData {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  videoRoomUrl: string | null;
  provider: AppointmentProvider | null;
}

function ConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDisclosure, setShowDisclosure] = useState(true);

  useEffect(() => {
    if (!appointmentId) {
      setError("No appointment ID provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/appointments/${appointmentId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Appointment not found");
        return r.json();
      })
      .then((data) => setAppointment(data.appointment))
      .catch((e) => setError(e.message ?? "Failed to load appointment"))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-primary-400" />
          <p className="text-gray-300">Loading consultation…</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to load consultation</h2>
            <p className="text-sm text-gray-500 mb-6">{error ?? "Appointment not found."}</p>
            <Button onClick={() => router.push("/dashboard")} variant="secondary">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const provider = appointment.provider;

  return (
    <div className="h-screen bg-gray-900 flex flex-col">

      {/* Disclosure modal */}
      {showDisclosure && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Provider Information</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                As required by the College of Physicians and Surgeons of Ontario (CPSO), please review
                your provider&apos;s information:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                {provider ? (
                  <>
                    <div>
                      <div className="text-xs text-gray-500">Provider Name</div>
                      <div className="font-medium text-gray-900">{provider.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Credentials</div>
                      <div className="font-medium text-gray-900">
                        {provider.credentials} · {provider.specialty}
                      </div>
                    </div>
                    {provider.cpso_number && (
                      <div>
                        <div className="text-xs text-gray-500">CPSO Registration #</div>
                        <div className="font-medium text-gray-900">{provider.cpso_number}</div>
                      </div>
                    )}
                    {provider.location && (
                      <div>
                        <div className="text-xs text-gray-500">Location</div>
                        <div className="font-medium text-gray-900">{provider.location}</div>
                      </div>
                    )}
                    {provider.phone && (
                      <div>
                        <div className="text-xs text-gray-500">Contact</div>
                        <div className="font-medium text-gray-900">{provider.phone}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Provider information not available.</p>
                )}
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600 mb-6">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Please confirm you are in a private location where your conversation cannot be overheard.
                </span>
              </div>
              <Button onClick={() => setShowDisclosure(false)} className="w-full" size="lg">
                I Confirm &amp; Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="h-6 w-6 text-primary-400" />
          <span className="text-white font-semibold">KlaraMD</span>
        </div>
        {provider && (
          <div className="text-sm text-gray-300">
            {provider.name} · CPSO #{provider.cpso_number}
          </div>
        )}
        <Button
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="bg-red-600 hover:bg-red-700 text-white text-xs"
        >
          End &amp; Exit
        </Button>
      </header>

      {/* Video area */}
      <div className="flex-1 relative">
        {appointment.videoRoomUrl ? (
          <iframe
            src={appointment.videoRoomUrl}
            allow="camera; microphone; fullscreen; display-capture"
            className="absolute inset-0 w-full h-full border-0"
            title="Video Consultation"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-white text-lg font-medium mb-2">Video Not Available</p>
              <p className="text-gray-400 text-sm max-w-xs">
                No video room has been set up for this appointment. Please contact support or
                refresh if you believe this is an error.
              </p>
              {provider && (
                <p className="text-gray-500 text-sm mt-4">
                  Provider contact: {provider.phone}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-gray-900 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-400" />
        </div>
      }
    >
      <ConsultationContent />
    </Suspense>
  );
}
