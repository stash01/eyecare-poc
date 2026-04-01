"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Video,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Provider {
  id: string;
  name: string;
  credentials: string;
  specialty: string;
  subspecialty: string | null;
  expertise: string[];
  cpso_number: string | null;
}

function generateWeekdayDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 1; dates.length < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push(date);
    }
  }
  return dates;
}

function formatDateParam(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatSlotDisplay(isoSlot: string): string {
  const date = new Date(isoSlot);
  return date.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  });
}

function formatDateShort(date: Date) {
  return {
    day: date.toLocaleDateString("en-CA", { weekday: "short" }),
    date: date.getDate(),
    month: date.toLocaleDateString("en-CA", { month: "short" }),
  };
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BookingPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [dateOffset, setDateOffset] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dates = generateWeekdayDates();
  const visibleDates = dates.slice(dateOffset, dateOffset + 5);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((data) => setProviders(data.providers ?? []))
      .catch(() => setError("Failed to load providers. Please refresh."))
      .finally(() => setProvidersLoading(false));
  }, []);

  const fetchSlots = useCallback(async (providerId: string, date: Date) => {
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `/api/availability?provider_id=${providerId}&date=${formatDateParam(date)}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setError("Failed to load availability. Please try again.");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (selectedProvider) {
      fetchSlots(selectedProvider.id, date);
    }
  };

  const handleConfirm = async () => {
    if (!selectedProvider || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: selectedProvider.id,
          scheduled_at: selectedSlot,
          duration_minutes: 30,
          appointment_type: "new_patient",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to book appointment.");
        return;
      }
      router.push(`/confirmation?id=${data.appointment.id}`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Video className="h-4 w-4" />
            <span>Video Consultation</span>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Let&apos;s Find a Time That Works for You
            </h1>
            <p className="text-gray-600">
              Choose a provider and a time that fits your schedule — all consultations happen from the comfort of your home
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Provider */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                Select a Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              {providersLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading providers...
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderSelect(provider)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedProvider?.id === provider.id
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                          <p className="text-sm text-gray-600">
                            {provider.credentials} • {provider.specialty}
                          </p>
                          {provider.subspecialty && (
                            <p className="text-xs text-primary-600 font-medium mt-1">
                              {provider.subspecialty}
                            </p>
                          )}
                          {provider.cpso_number && (
                            <p className="text-xs text-gray-500 mt-1">
                              CPSO #{provider.cpso_number}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {provider.expertise.map((exp, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded"
                              >
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Date */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedProvider ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  2
                </div>
                Select a Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDateOffset(Math.max(0, dateOffset - 1))}
                  disabled={dateOffset === 0 || !selectedProvider}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex-1 grid grid-cols-5 gap-2">
                  {visibleDates.map((date) => {
                    const formatted = formatDateShort(date);
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateSelect(date)}
                        disabled={!selectedProvider}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          isSelected
                            ? "border-primary-600 bg-primary-50"
                            : selectedProvider
                            ? "border-gray-200 hover:border-primary-300"
                            : "border-gray-100 bg-gray-50 opacity-50"
                        }`}
                      >
                        <div className="text-xs text-gray-500">{formatted.day}</div>
                        <div className="text-xl font-bold text-gray-900">{formatted.date}</div>
                        <div className="text-xs text-gray-500">{formatted.month}</div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDateOffset(Math.min(dates.length - 5, dateOffset + 1))}
                  disabled={dateOffset >= dates.length - 5 || !selectedProvider}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Time */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedDate ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  3
                </div>
                Select a Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8 text-gray-500">Please select a date first</div>
              ) : slotsLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Checking availability...
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No availability on this date. Please select another day.
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        selectedSlot === slot
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <Clock className="h-4 w-4 mx-auto mb-1 opacity-60" />
                      <span className="text-sm font-medium">{formatSlotDisplay(slot)}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary + confirm */}
          {selectedProvider && selectedDate && selectedSlot && (
            <Card className="border-primary-200 bg-primary-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Appointment Summary</h3>
                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium">{selectedProvider.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDateLong(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{formatSlotDisplay(selectedSlot)} (EST)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">Video Consultation (30 min)</span>
                  </div>
                </div>
                <Button onClick={handleConfirm} size="lg" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
