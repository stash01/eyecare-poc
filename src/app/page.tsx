"use client";

import { Button } from "@/components/ui/button";
import {
  Eye, Shield, ArrowRight, Heart, Award, Clock,
  CheckCircle, Droplets, Sun, Wind, Zap, Activity,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

// Abstract iris SVG — inline, zero dependencies
function IrisGraphic() {
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="sclera" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0f9fa" />
          <stop offset="100%" stopColor="#d0eaef" />
        </radialGradient>
        <radialGradient id="iris-outer" cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#2898b2" />
          <stop offset="40%" stopColor="#0b617d" />
          <stop offset="100%" stopColor="#042a3a" />
        </radialGradient>
        <radialGradient id="iris-inner" cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#107b98" />
          <stop offset="100%" stopColor="#094e66" />
        </radialGradient>
        <radialGradient id="pupil-grad" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#1a2a33" />
          <stop offset="100%" stopColor="#042a3a" />
        </radialGradient>
        <radialGradient id="highlight" cx="35%" cy="30%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id="soft-blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <clipPath id="eye-clip">
          <ellipse cx="240" cy="240" rx="230" ry="230" />
        </clipPath>
      </defs>

      {/* Outer glow ring */}
      <ellipse cx="240" cy="240" rx="238" ry="238" fill="none" stroke="#a1d5e0" strokeWidth="1" opacity="0.4" className="animate-pulse-ring" />
      <ellipse cx="240" cy="240" rx="220" ry="220" fill="none" stroke="#60b9cc" strokeWidth="0.5" opacity="0.3" />

      {/* Sclera */}
      <ellipse cx="240" cy="240" rx="200" ry="200" fill="url(#sclera)" />

      {/* Limbal ring */}
      <ellipse cx="240" cy="240" rx="155" ry="155" fill="none" stroke="#094e66" strokeWidth="3" opacity="0.25" />

      {/* Iris base */}
      <ellipse cx="240" cy="240" rx="150" ry="150" fill="url(#iris-outer)" />

      {/* Iris radial fibres — 24 lines */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const x1 = 240 + Math.cos(angle) * 75;
        const y1 = 240 + Math.sin(angle) * 75;
        const x2 = 240 + Math.cos(angle) * 148;
        const y2 = 240 + Math.sin(angle) * 148;
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#2898b2"
            strokeWidth="0.8"
            opacity="0.35"
          />
        );
      })}

      {/* Iris crypts — organic arcs */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const cx = 240 + Math.cos(angle) * 110;
        const cy = 240 + Math.sin(angle) * 110;
        return (
          <ellipse
            key={i}
            cx={cx} cy={cy}
            rx="12" ry="8"
            fill="none"
            stroke="#60b9cc"
            strokeWidth="0.7"
            opacity="0.4"
            transform={`rotate(${(angle * 180) / Math.PI}, ${cx}, ${cy})`}
          />
        );
      })}

      {/* Inner iris ring */}
      <ellipse cx="240" cy="240" rx="76" ry="76" fill="url(#iris-inner)" />

      {/* Pupil */}
      <ellipse cx="240" cy="240" rx="60" ry="60" fill="url(#pupil-grad)" />

      {/* Pupil depth rings */}
      <ellipse cx="240" cy="240" rx="50" ry="50" fill="none" stroke="#1a2a33" strokeWidth="1" opacity="0.5" />
      <ellipse cx="240" cy="240" rx="35" ry="35" fill="#042a3a" opacity="0.7" />

      {/* Specular highlight */}
      <ellipse cx="210" cy="210" rx="22" ry="16" fill="url(#highlight)" opacity="0.85" />
      <ellipse cx="264" cy="222" rx="6" ry="4" fill="white" opacity="0.35" />

      {/* Outer decorative rings */}
      <ellipse cx="240" cy="240" rx="202" ry="202" fill="none" stroke="#a1d5e0" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.5" className="animate-rotate-slow" />
      <ellipse cx="240" cy="240" rx="215" ry="215" fill="none" stroke="#d0eaef" strokeWidth="0.5" strokeDasharray="2 12" opacity="0.4" />
    </svg>
  );
}

export default function Home() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/80 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Eye className="h-4.5 w-4.5 text-white h-5 w-5" />
              </div>
              <span className="text-lg font-semibold text-primary-900 tracking-tight">
                Klara<span className="text-primary-500">MD</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/shop" className="text-sm text-stone-600 hover:text-primary-700 transition-colors">
                Shop
              </Link>
              <Link href="#how-it-works" className="text-sm text-stone-600 hover:text-primary-700 transition-colors">
                How It Works
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="text-sm text-stone-600 hover:text-primary-700 transition-colors">
                    Dashboard
                  </Link>
                  <button onClick={logout} className="text-sm text-stone-600 hover:text-primary-700 transition-colors">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-stone-600 hover:text-primary-700 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="rounded-xl">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700" />
        {/* Subtle grain */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")"
        }} />
        {/* Radial light source */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent-500/10 blur-[80px] pointer-events-none" />

        <div className="relative container mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Copy */}
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                <span className="text-sm text-white/90 font-medium">Ontario-licensed specialists</span>
              </div>

              <h1 className="font-display text-5xl lg:text-6xl text-white leading-[1.08] mb-6 text-balance">
                Specialist eye care,<br />
                <span className="text-primary-300">on your terms</span>
              </h1>

              <p className="text-lg text-primary-100/80 leading-relaxed mb-10 max-w-md">
                Board-certified ophthalmologists available virtually. Get a clinically
                validated dry eye assessment and a personalised treatment plan —
                without the waiting room.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-primary-800 hover:bg-stone-50 shadow-lg hover:shadow-xl font-semibold w-full sm:w-auto">
                    Start Your Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 border border-white/20 w-full sm:w-auto">
                    How It Works
                  </Button>
                </Link>
              </div>

              <p className="mt-5 text-sm text-primary-200/60">
                Free to start. No referral needed.
              </p>
            </div>

            {/* Right: Iris Graphic */}
            <div className="flex justify-center lg:justify-end animate-fade-up-delay-2">
              <div className="relative w-72 h-72 lg:w-96 lg:h-96">
                {/* Outer glow */}
                <div className="absolute inset-[-20px] rounded-full bg-primary-400/20 blur-2xl" />
                <IrisGraphic />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f8f6f3] to-transparent pointer-events-none" />
      </section>

      {/* ── Trust bar ──────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-stone-200">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              { icon: Award,        text: "Led by board-certified ophthalmologists" },
              { icon: Shield,       text: "PHIPA-compliant · Canadian data" },
              { icon: CheckCircle,  text: "Evidence-based treatment protocols" },
              { icon: Clock,        text: "Same-week consultations" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-stone-600">
                <Icon className="h-4 w-4 text-primary-500 flex-shrink-0" />
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Symptoms ───────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">

            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 text-primary-600 mb-4">
                <Heart className="h-4 w-4" />
                <span className="text-sm font-semibold uppercase tracking-widest">You&apos;re not alone</span>
              </div>
              <h2 className="font-display text-4xl lg:text-5xl text-stone-900 mb-4">
                Does this sound familiar?
              </h2>
              <p className="text-stone-500 text-lg max-w-xl mx-auto">
                Over 6 million Canadians live with dry eye disease. If these symptoms
                resonate, specialist care can help.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {symptoms.map((symptom, i) => (
                <div
                  key={i}
                  className={`group relative p-5 rounded-2xl border border-stone-200 bg-white shadow-card hover:shadow-card-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-up-delay-${Math.min(i + 1, 4)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <symptom.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900 mb-1">{symptom.title}</h3>
                      <p className="text-sm text-stone-500 leading-relaxed">{symptom.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/register">
                <Button size="lg">
                  Take the Free Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="mt-3 text-sm text-stone-400">2–3 minutes · clinically validated</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900 to-primary-800" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")"
        }} />

        <div className="relative container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
              How KlaraMD Works
            </h2>
            <p className="text-primary-200/70 text-lg">
              Specialist-led care, delivered on your schedule.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white font-display text-xl flex-shrink-0 group-hover:bg-white/20 transition-colors">
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 bg-white/10 mt-2" />
                    )}
                  </div>
                  <div className="pb-6 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="h-5 w-5 text-accent-400" />
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-primary-200/70 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Klara ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl lg:text-5xl text-stone-900 mb-4">
                Built for serious eye care
              </h2>
              <p className="text-stone-500 text-lg max-w-xl mx-auto">
                Not a symptom checker. Real specialist care, built on clinical evidence.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {trust.map((item, i) => (
                <div key={i} className="flex gap-5 p-6 rounded-2xl border border-stone-100 bg-stone-50 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-600 via-accent-500 to-accent-400" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")"
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-[80px]" />

        <div className="relative container mx-auto px-6 text-center">
          <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
            Ready for clearer, more comfortable eyes?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Create your account, take the assessment, and receive an evidence-based
            treatment plan from a board-certified specialist.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-accent-700 hover:bg-stone-50 shadow-lg hover:shadow-xl font-semibold">
              Create Your Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-primary-900 text-primary-300/70">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-semibold tracking-tight">
                  Klara<span className="text-primary-400">MD</span>
                </span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">
                Virtual ophthalmology for Ontario residents. Evidence-based care, available on your schedule.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div className="space-y-2">
                <Link href="/privacy" className="block hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/contact" className="block hover:text-white transition-colors">Contact Us</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-primary-800 text-sm space-y-2">
            <p>
              This platform provides virtual consultations with licensed healthcare providers.
              For medical emergencies, please call 911 or visit your nearest emergency room.
            </p>
            <p className="text-primary-400/50">
              &copy; {new Date().getFullYear()} KlaraMD. Ontario, Canada.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const symptoms = [
  {
    icon: Zap,
    title: "Burning & stinging",
    description: "Persistent discomfort that worsens throughout the day, especially after screen time.",
  },
  {
    icon: Activity,
    title: "Gritty, sandy sensation",
    description: "A constant feeling that something is in your eye that won't go away.",
  },
  {
    icon: Droplets,
    title: "Excessive tearing",
    description: "Paradoxically, your eyes water constantly as they compensate for dryness.",
  },
  {
    icon: Eye,
    title: "Fluctuating vision",
    description: "Vision that blurs and clears with blinking, affecting focus and concentration.",
  },
  {
    icon: Sun,
    title: "Light sensitivity",
    description: "Discomfort in bright environments that limits your daily activities.",
  },
  {
    icon: Wind,
    title: "Environmental triggers",
    description: "Symptoms worsen in air conditioning, wind, or dry heated spaces.",
  },
];

const steps = [
  {
    icon: Eye,
    title: "Create your account",
    description: "Sign up in minutes and access your personal dashboard with symptom tracking and resources.",
  },
  {
    icon: Activity,
    title: "Take your clinical assessment",
    description: "Answer validated questions about your symptoms — the same tools ophthalmologists use in practice.",
  },
  {
    icon: CheckCircle,
    title: "Unlock your personalised results",
    description: "Subscribe to access your severity score, evidence-based product recommendations, and treatment guidance.",
  },
  {
    icon: Heart,
    title: "Connect with a specialist",
    description: "Book a video consultation with a board-certified ophthalmologist who can prescribe treatment.",
  },
];

const trust = [
  {
    icon: Award,
    title: "Led by board-certified specialists",
    description: "Board-certified ophthalmologists with deep expertise in dry eye disease and ocular surface care.",
  },
  {
    icon: Shield,
    title: "PHIPA-compliant & Canadian",
    description: "Your health information is protected under Canadian privacy law and stored on Canadian servers.",
  },
  {
    icon: CheckCircle,
    title: "Evidence-based assessment",
    description: "Our assessment uses clinically validated questionnaires and evidence-based treatment protocols.",
  },
  {
    icon: Clock,
    title: "No waiting rooms",
    description: "Connect with specialists through video consultations typically within the same week.",
  },
];
