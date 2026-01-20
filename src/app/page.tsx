import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, Clock, Shield, ArrowRight } from "lucide-react";
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
              EyeCare
            </span>
          </div>
          <div className="flex items-center gap-4">
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
            Tired of living with
            <span className="text-primary-600"> dry, irritated eyes</span>?
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            You don&apos;t have to endure the burning, grittiness, and discomfort
            any longer. Take our free 2-minute assessment and get personalized
            relief recommendations today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/assessment">
              <Button size="lg" className="text-lg">
                Start Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="secondary">
              Learn More
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No account required to start. Your privacy is protected.
          </p>
        </div>
      </section>

      {/* Symptoms Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Do any of these sound familiar?
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Dry eye disease affects millions of Canadians.
              You&apos;re not alone.
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
                If you checked even one of these, our assessment can help
                identify the best path to relief.
              </p>
              <Link href="/assessment">
                <Button size="lg">
                  Check My Symptoms
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
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              How it works
            </h2>

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
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <Shield className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Privacy Protected
                </h3>
                <p className="text-sm text-gray-600">
                  PHIPA-compliant. Your health information stays in Canada and
                  is never shared without your consent.
                </p>
              </div>
              <div className="p-6">
                <CheckCircle className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Physician-Backed
                </h3>
                <p className="text-sm text-gray-600">
                  Our assessment is based on clinically validated questionnaires
                  used by eye care professionals.
                </p>
              </div>
              <div className="p-6">
                <Clock className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Quick Results
                </h3>
                <p className="text-sm text-gray-600">
                  Get your personalized recommendations in just 2 minutes.
                  No waiting rooms, no delays.
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
            Ready to find relief?
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Take the first step toward comfortable, healthy eyes.
            Our free assessment takes just 2 minutes.
          </p>
          <Link href="/assessment">
            <Button
              size="lg"
              className="bg-white text-primary-700 hover:bg-primary-50 text-lg"
            >
              Start Your Free Assessment
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
                <span className="text-white font-semibold">EyeCare</span>
              </div>
              <div className="flex gap-6 text-sm">
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
              <p>
                This assessment is for informational purposes and does not
                constitute medical advice. For severe symptoms, please consult
                a healthcare provider.
              </p>
              <p className="mt-4">
                &copy; {new Date().getFullYear()} EyeCare. Ontario, Canada.
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
    title: "Burning or stinging sensation",
    description: "A persistent burning feeling, especially at the end of the day or after screen time.",
  },
  {
    icon: Eye,
    title: "Gritty, sandy feeling",
    description: "Like there's something in your eye that you can't blink away.",
  },
  {
    icon: Eye,
    title: "Excessive watering",
    description: "Ironically, dry eyes often cause excessive tearing as your eyes try to compensate.",
  },
  {
    icon: Eye,
    title: "Tired, heavy eyes",
    description: "Eyes that feel fatigued, especially after reading, driving, or using screens.",
  },
  {
    icon: Eye,
    title: "Blurry vision that comes and goes",
    description: "Vision that clears temporarily after blinking, then blurs again.",
  },
  {
    icon: Eye,
    title: "Sensitivity to light",
    description: "Discomfort in bright environments or when looking at screens.",
  },
];

const steps = [
  {
    title: "Complete a quick assessment",
    description: "Answer a few questions about your symptoms. It takes less than 2 minutes and helps us understand your specific situation.",
  },
  {
    title: "Get your personalized results",
    description: "Based on your answers, we'll assess the severity of your symptoms and provide tailored recommendations for relief.",
  },
  {
    title: "Access treatment options",
    description: "For mild cases, get immediate self-care tips. For moderate or severe symptoms, easily book a video consultation with an Ontario eye care specialist.",
  },
];
