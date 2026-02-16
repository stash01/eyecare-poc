"use client";

import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, Clock, Shield, ArrowRight, Heart, Award } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">
              KlaraMD
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/shop" className="text-primary-700 hover:text-primary-800">
              Shop
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-primary-700 hover:text-primary-800">
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="text-primary-700 hover:text-primary-800"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-primary-700 hover:text-primary-800">
                  Login
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Specialist eye care for
            <span className="text-primary-600"> dry eyes </span>
            — without the wait
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Expert care from board-certified ophthalmologists, delivered virtually.
            Get a personalized assessment and evidence-based treatment plan
            tailored to your symptoms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="secondary">
              How It Works
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Create your account to complete your personalized symptom assessment.
          </p>
        </div>
      </section>

      {/* Empathy Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-primary-600" />
              <span className="text-primary-600 font-medium">You&apos;re not alone</span>
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Does this sound familiar?
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Millions of Canadians live with dry eye disease. If any of these
              symptoms resonate with you, specialist care can help.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {symptoms.map((symptom, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-5 rounded-xl bg-primary-50 border border-primary-100"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <symptom.icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {symptom.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {symptom.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-700 mb-4">
                Our clinically validated assessment helps identify your specific
                condition and guides you toward the right specialist care.
              </p>
              <Link href="/register">
                <Button size="lg">
                  Create Your Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-white to-primary-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              How KlaraMD Works
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Specialist-led care, delivered on your schedule.
            </p>

            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="p-6">
                <Award className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Specialist-Led
                </h3>
                <p className="text-sm text-gray-600">
                  Board-certified ophthalmologists with fellowship training in
                  cornea and ocular surface disease.
                </p>
              </div>
              <div className="p-6">
                <Shield className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Protected &amp; Private
                </h3>
                <p className="text-sm text-gray-600">
                  Your health information is protected under Canadian privacy law
                  and never shared without your consent.
                </p>
              </div>
              <div className="p-6">
                <CheckCircle className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Evidence-Based
                </h3>
                <p className="text-sm text-gray-600">
                  Our assessment uses clinically validated questionnaires aligned
                  with TFOS DEWS II guidelines.
                </p>
              </div>
              <div className="p-6">
                <Clock className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Care on Your Schedule
                </h3>
                <p className="text-sm text-gray-600">
                  No waiting rooms. Connect with specialists through convenient
                  video consultations when it works for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get the care you deserve?
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Create your account to complete a personalized symptom assessment
            and receive an evidence-based treatment plan from our specialists.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-white text-primary-700 hover:bg-primary-50 text-lg"
            >
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <Eye className="h-6 w-6 text-primary-400" />
                <span className="text-white font-semibold">KlaraMD</span>
              </div>
              <div className="flex gap-6 text-sm">
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
                <Link href="/contact" className="hover:text-white">
                  Contact Us
                </Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
              <p>
                This platform provides virtual consultations with licensed healthcare
                providers. For medical emergencies, please call 911 or visit your
                nearest emergency room.
              </p>
              <p className="mt-4">
                &copy; {new Date().getFullYear()} KlaraMD. Ontario, Canada.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const symptoms = [
  {
    icon: Eye,
    title: "Burning and stinging",
    description: "Persistent discomfort that worsens throughout the day, especially after screen time.",
  },
  {
    icon: Eye,
    title: "Gritty, sandy sensation",
    description: "A constant feeling that something is in your eye that you can't remove.",
  },
  {
    icon: Eye,
    title: "Excessive tearing",
    description: "Paradoxically, your eyes water constantly as they try to compensate for dryness.",
  },
  {
    icon: Eye,
    title: "Heavy, fatigued eyes",
    description: "Reading, driving, and daily tasks become difficult when your eyes are strained.",
  },
  {
    icon: Eye,
    title: "Fluctuating vision",
    description: "Vision that blurs and clears with blinking, affecting focus and concentration.",
  },
  {
    icon: Eye,
    title: "Light sensitivity",
    description: "Discomfort in bright environments that limits your daily activities.",
  },
];

const steps = [
  {
    title: "Create your account",
    description: "Sign up in minutes and access your personal dashboard with symptom tracking, resources, and community.",
  },
  {
    title: "Take your assessment",
    description: "Answer clinically validated questions about your symptoms. Our assessment is based on the same tools ophthalmologists use in practice.",
  },
  {
    title: "Subscribe to unlock results",
    description: "Choose a plan to access your personalized severity score, evidence-based product recommendations, and treatment guidance.",
  },
  {
    title: "Connect with a specialist",
    description: "For moderate to severe symptoms, book a video consultation with a fellowship-trained ophthalmologist who can prescribe treatment.",
  },
];
