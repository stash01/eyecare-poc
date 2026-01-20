"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  Droplets,
  Sun,
  Monitor,
  Wind,
  Fish,
  Clock,
  CheckCircle,
  ArrowRight,
  Printer,
  Mail,
} from "lucide-react";
import Link from "next/link";

type Priority = "high" | "medium" | "low";

interface RecommendationItem {
  name: string;
  details: string;
  priority: Priority;
}

interface RecommendationCategory {
  category: string;
  icon: React.ElementType;
  description: string;
  items: RecommendationItem[];
}

const recommendations: RecommendationCategory[] = [
  {
    category: "Artificial Tears",
    icon: Droplets,
    description: "A gentle first step that helps many people",
    items: [
      {
        name: "Preservative-Free Artificial Tears",
        details: "These are the gentlest option for your eyes. Use 4-6 times daily or whenever you need relief. Brands like Systane Ultra, Refresh Optive, or TheraTears are widely available.",
        priority: "high",
      },
      {
        name: "Gel Drops for Nighttime",
        details: "If you wake up with dry, uncomfortable eyes, a thicker gel before bed can help. Try GenTeal Gel or Systane Gel for overnight comfort.",
        priority: "medium",
      },
    ],
  },
  {
    category: "Warm Compresses",
    icon: Sun,
    description: "A soothing ritual that can make a real difference",
    items: [
      {
        name: "Daily Warm Compress Routine",
        details: "This feels wonderful and actually helps! Apply a warm, damp cloth to closed eyes for 10 minutes, once or twice daily. A microwaveable eye mask makes this easier and more consistent.",
        priority: "high",
      },
      {
        name: "Gentle Lid Massage",
        details: "After your warm compress, gently massage your eyelids in small circles. This helps release natural oils that protect your tears.",
        priority: "medium",
      },
    ],
  },
  {
    category: "Lid Hygiene",
    icon: Eye,
    description: "Small habits that support healthier eyes",
    items: [
      {
        name: "Eyelid Cleansing Wipes",
        details: "Pre-moistened lid wipes (like OCuSOFT or Systane Lid Wipes) make daily cleaning quick and easy. Just a gentle wipe along your lash line each day.",
        priority: "high",
      },
      {
        name: "Baby Shampoo Alternative",
        details: "If you prefer a DIY approach: dilute a drop of baby shampoo in water, apply gently with a cotton swab along your lash line, then rinse well.",
        priority: "low",
      },
    ],
  },
  {
    category: "Screen Habits",
    icon: Monitor,
    description: "Your screen time doesn't have to hurt",
    items: [
      {
        name: "The 20-20-20 Rule",
        details: "Every 20 minutes, look at something 20 feet away for 20 seconds. It sounds simple, but it really helps! Try setting a gentle reminder.",
        priority: "high",
      },
      {
        name: "Remember to Blink",
        details: "Here's something surprising: we blink 66% less when looking at screens. Make a conscious effort to blink fully and often — your eyes will thank you.",
        priority: "medium",
      },
      {
        name: "Screen Position Matters",
        details: "Position your screen slightly below eye level. This small change reduces how much of your eye surface is exposed to air.",
        priority: "medium",
      },
    ],
  },
  {
    category: "Environment",
    icon: Wind,
    description: "Small changes to where you spend time",
    items: [
      {
        name: "Add a Humidifier",
        details: "Dry air is tough on eyes. A humidifier can make a noticeable difference, especially during winter when heating dries out indoor air.",
        priority: "medium",
      },
      {
        name: "Watch for Air Currents",
        details: "Fans, air vents, and AC blowing on your face can really aggravate symptoms. Try repositioning yourself or redirecting the airflow.",
        priority: "medium",
      },
    ],
  },
  {
    category: "Nutrition",
    icon: Fish,
    description: "Nourishing your eyes from the inside",
    items: [
      {
        name: "Omega-3 Fatty Acids",
        details: "Fish oil or flaxseed oil supplements (1000-2000mg daily) can support your tear film. Be patient — it may take 2-3 months to notice the benefits.",
        priority: "medium",
      },
      {
        name: "Stay Hydrated",
        details: "It seems obvious, but drinking enough water throughout the day really does help. Aim for 8+ glasses — your whole body will benefit, including your eyes.",
        priority: "high",
      },
    ],
  },
];

const priorityColors: Record<Priority, string> = {
  high: "bg-primary-100 text-primary-800 border-primary-200",
  medium: "bg-gray-100 text-gray-700 border-gray-200",
  low: "bg-gray-50 text-gray-600 border-gray-100",
};

export default function RecommendationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">Klara</span>
          </Link>
          <Link href="/results">
            <Button variant="ghost" size="sm">
              ← Back to Results
            </Button>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Here's What Can Help
            </h1>
            <p className="text-gray-600">
              Gentle, proven approaches to help you feel more comfortable — start wherever feels right for you
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <Button variant="secondary" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print List
            </Button>
            <Button variant="secondary" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Email to Me
            </Button>
          </div>

          <Card className="mb-8 border-primary-200 bg-primary-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Be patient with yourself
                  </h3>
                  <p className="text-sm text-gray-700">
                    Healing takes time — most people start noticing improvement after 2-4 weeks of consistent care.
                    It's okay if progress feels slow. You're doing something good for your eyes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {recommendations.map((category) => (
              <Card key={category.category}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <category.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <span className="block">{category.category}</span>
                      <span className="text-sm font-normal text-gray-500">
                        {category.description}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.items.map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${priorityColors[item.priority]}`}
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium mb-1">{item.name}</h4>
                            <p className="text-sm opacity-90">{item.details}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Still struggling? We're here for you.
                </h3>
                <p className="text-gray-600 mb-4">
                  If you've been trying these approaches for a few weeks and still aren't feeling better,
                  that's okay — sometimes you need a little extra help. Our specialists can explore prescription options with you.
                </p>
                <Link href="/register">
                  <Button size="lg">
                    Talk to a Specialist
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              Curious how you're progressing?
            </p>
            <Link href="/assessment">
              <Button variant="ghost" size="sm">
                Check In Again in a Few Weeks
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
