"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  CheckCircle,
  Calendar,
  Clock,
  User,
  Video,
  Mail,
  ArrowRight,
  Download,
  Bell,
} from "lucide-react";
import Link from "next/link";

const appointment = {
  id: "APT-2024-001234",
  provider: "Dr. Sarah Chen",
  credentials: "MD, FRCSC",
  specialty: "Ophthalmologist",
  subspecialty: "Cornea & External Disease",
  date: "Monday, February 5, 2024",
  time: "10:30 AM",
  timezone: "EST",
  type: "Video Consultation",
  duration: "30 minutes",
};

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">Klara</span>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              You're All Set!
            </h1>
            <p className="text-gray-600">
              We're looking forward to helping you feel better. Check your email for
              all the details — and don't hesitate to reach out if you have any questions.
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <span className="text-sm text-gray-500">Confirmation #</span>
                <span className="font-mono font-medium text-gray-900">
                  {appointment.id}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {appointment.provider}
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointment.credentials} • {appointment.specialty}
                    </div>
                    <div className="text-sm text-primary-600">
                      {appointment.subspecialty}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {appointment.date}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {appointment.time} ({appointment.timezone})
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointment.duration}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Video className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {appointment.type}
                    </div>
                    <div className="text-sm text-gray-500">
                      Link will be available 15 minutes before
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button variant="secondary" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>
                <Button variant="secondary" size="sm" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-primary-200 bg-primary-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary-600" />
                Prepare for Your Consultation
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Find a quiet, well-lit, private location for your video call
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Test your camera and microphone before the appointment
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Have your Ontario Health Card ready if using OHIP coverage
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>
                    List any medications you&apos;re currently taking for your eyes
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Write down any questions you want to ask the doctor
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Link href="/dashboard" className="block">
              <Button size="lg" className="w-full">
                Go to My Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button size="lg" variant="ghost" className="w-full">
                Return to Home
              </Button>
            </Link>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Need to reschedule?{" "}
            <Link href="/dashboard" className="text-primary-600 underline">
              Manage your appointment
            </Link>{" "}
            or contact us at{" "}
            <a href="mailto:support@klarahealth.ca" className="text-primary-600 underline">
              support@klarahealth.ca
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
