import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, Clock, Shield, ArrowRight, Heart, Award } from "lucide-react";
import Link from "next/link";

export default function Home() {
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
            <Link href="/login" className="text-primary-700 hover:text-primary-800">
              Sign In
            </Link>
            <Link href="/assessment">
              <Button size="sm">
                Start Assessment
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            We understand how
            <span className="text-primary-600"> frustrating dry eyes </span>
            can be
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            The constant discomfort. The burning. The blurry vision that makes
            every day harder than it should be. You&apos;ve been dealing with this
            long enough — and we&apos;re here to help you find relief.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/assessment">
              <Button size="lg" className="text-lg">
                Take the Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="secondary">
              Learn How We Can Help
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Takes just 2 minutes. No account needed. Your answers stay private.
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
              Does this sound like your daily struggle?
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Millions of Canadians live with dry eye disease. If any of these
              feel familiar, know that relief is possible — and we can help you get there.
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
                If even one of these resonates with you, our assessment can help
                identify what&apos;s happening and guide you toward the right care.
              </p>
              <Link href="/assessment">
                <Button size="lg">
                  Find Out What&apos;s Causing Your Symptoms
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
              Getting help is simple
            </h2>
            <p className="text-center text-gray-600 mb-12">
              We&apos;ve made it easy to understand your symptoms and connect with care —
              all from the comfort of your home.
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
                  Ophthalmologist-Led
                </h3>
                <p className="text-sm text-gray-600">
                  Board-certified ophthalmologists with fellowship training in
                  cornea and ocular surface disease.
                </p>
              </div>
              <div className="p-6">
                <Shield className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Your Privacy Matters
                </h3>
                <p className="text-sm text-gray-600">
                  Your health information is protected under Canadian privacy law
                  and never shared without your explicit consent.
                </p>
              </div>
              <div className="p-6">
                <CheckCircle className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Clinically Validated
                </h3>
                <p className="text-sm text-gray-600">
                  Our assessment is based on the same questionnaires board-certified
                  ophthalmologists use every day in their practice.
                </p>
              </div>
              <div className="p-6">
                <Clock className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Care on Your Schedule
                </h3>
                <p className="text-sm text-gray-600">
                  No more waiting rooms or taking time off work. Get answers now
                  and connect with specialists when it works for you.
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
            You deserve to feel comfortable again
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Let&apos;s start with a simple assessment to understand what you&apos;re
            experiencing. In just 2 minutes, you&apos;ll have personalized
            recommendations and a path forward.
          </p>
          <Link href="/assessment">
            <Button
              size="lg"
              className="bg-white text-primary-700 hover:bg-primary-50 text-lg"
            >
              Start Your Assessment
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
                This assessment provides guidance based on your symptoms but is not
                a substitute for professional medical advice. If you&apos;re experiencing
                severe symptoms, please seek care from a healthcare provider.
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
    title: "That burning, stinging feeling",
    description: "It starts small but by evening, your eyes feel like they're on fire — especially after a long day at the screen.",
  },
  {
    icon: Eye,
    title: "Gritty, like sand is stuck",
    description: "No matter how much you blink or rub, it feels like something's there that you just can't get rid of.",
  },
  {
    icon: Eye,
    title: "Watery eyes that won't stop",
    description: "It seems backwards, but your eyes water constantly as they try desperately to find relief.",
  },
  {
    icon: Eye,
    title: "Heavy, exhausted eyes",
    description: "Reading, driving, working — everything feels harder when your eyes are this tired and strained.",
  },
  {
    icon: Eye,
    title: "Vision that blurs and clears",
    description: "You blink and it's clear for a moment, then blurs again. It's exhausting and distracting.",
  },
  {
    icon: Eye,
    title: "Sensitivity that limits your day",
    description: "Bright lights, screens, even being outside — the discomfort makes you want to just close your eyes.",
  },
];

const steps = [
  {
    title: "Tell us what you're experiencing",
    description: "Answer a few simple questions about your symptoms. There are no right or wrong answers — just be honest about how you're feeling. It takes less than 2 minutes.",
  },
  {
    title: "Get personalized insights",
    description: "Based on what you share, we'll help you understand the severity of your symptoms and what might be causing them. You'll receive recommendations tailored specifically to you.",
  },
  {
    title: "Take the next step that's right for you",
    description: "For milder symptoms, we'll share proven self-care strategies. If your symptoms suggest you'd benefit from professional care, we'll connect you with a fellowship-trained ophthalmologist through a convenient video consultation.",
  },
];
