"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";

const providers = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    credentials: "MD, FRCSC",
    specialty: "Ophthalmologist",
    subspecialty: "Cornea & External Disease",
    expertise: ["Dry Eye Disease", "Ocular Surface Disorders", "Corneal Conditions"],
    cpsoNumber: "12345",
  },
  {
    id: 2,
    name: "Dr. James Wilson",
    credentials: "MD, FRCSC",
    specialty: "Ophthalmologist",
    subspecialty: "Oculoplastics & Tear Film",
    expertise: ["Meibomian Gland Dysfunction", "Blepharitis", "Punctal Procedures"],
    cpsoNumber: "67891",
  },
];

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
];

function generateDates() {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push(date);
    }
  }
  return dates;
}

export default function BookingPage() {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [dateOffset, setDateOffset] = useState(0);

  const dates = generateDates();
  const visibleDates = dates.slice(dateOffset, dateOffset + 5);

  const handleContinue = () => {
    if (selectedProvider && selectedDate && selectedTime) {
      router.push("/confirmation");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateShort = (date: Date) => {
    return {
      day: date.toLocaleDateString("en-CA", { weekday: "short" }),
      date: date.getDate(),
      month: date.toLocaleDateString("en-CA", { month: "short" }),
    };
  };

  const isSlotAvailable = (time: string, date: Date) => {
    const unavailable = ["10:00 AM", "2:30 PM"];
    return !unavailable.includes(time) || date.getDate() % 2 === 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">Klara</span>
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
              Let's Find a Time That Works for You
            </h1>
            <p className="text-gray-600">
              Choose a provider and a time that fits your schedule — all consultations happen from the comfort of your home
            </p>
          </div>

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
              <div className="grid md:grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedProvider === provider.id
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {provider.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {provider.credentials} • {provider.specialty}
                        </p>
                        <p className="text-xs text-primary-600 font-medium mt-1">
                          {provider.subspecialty}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          CPSO #{provider.cpsoNumber}
                        </p>
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
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedProvider
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-500"
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
                    const isSelected =
                      selectedDate?.toDateString() === date.toDateString();
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
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
                        <div className="text-xl font-bold text-gray-900">
                          {formatted.date}
                        </div>
                        <div className="text-xs text-gray-500">{formatted.month}</div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setDateOffset(Math.min(dates.length - 5, dateOffset + 1))
                  }
                  disabled={dateOffset >= dates.length - 5 || !selectedProvider}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedDate
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  3
                </div>
                Select a Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="grid grid-cols-5 gap-2">
                  {timeSlots.map((time) => {
                    const available = isSlotAvailable(time, selectedDate);
                    return (
                      <button
                        key={time}
                        onClick={() => available && setSelectedTime(time)}
                        disabled={!available}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          selectedTime === time
                            ? "border-primary-600 bg-primary-50"
                            : available
                            ? "border-gray-200 hover:border-primary-300"
                            : "border-gray-100 bg-gray-100 text-gray-400 line-through"
                        }`}
                      >
                        <Clock className="h-4 w-4 mx-auto mb-1 opacity-60" />
                        <span className="text-sm font-medium">{time}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Please select a date first
                </div>
              )}
            </CardContent>
          </Card>

          {selectedProvider && selectedDate && selectedTime && (
            <Card className="border-primary-200 bg-primary-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Appointment Summary
                </h3>
                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium">
                      {providers.find((p) => p.id === selectedProvider)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{selectedTime} (EST)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">Video Consultation</span>
                  </div>
                </div>
                <Button onClick={handleContinue} size="lg" className="w-full">
                  Confirm Booking
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
