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
    description: "The foundation of dry eye treatment",
    items: [
      {
        name: "Preservative-Free Artificial Tears",
        details: "Use 4-6 times daily or as needed. Look for brands like Systane Ultra, Refresh Optive, or TheraTears.",
        priority: "high",
      },
      {
        name: "Gel Drops for Nighttime",
        details: "Thicker formulation for overnight relief. Apply before bed. GenTeal Gel or Systane Gel are good options.",
        priority: "medium",
      },
    ],
  },
  {
    category: "Warm Compresses",
    icon: Sun,
    description: "Helps unblock oil glands in your eyelids",
    items: [
      {
        name: "Daily Warm Compress Routine",
        details: "Apply a warm, damp cloth to closed eyes for 10 minutes, 1-2 times daily. Use a microwaveable eye mask for consistent heat.",
        priority: "high",
      },
      {
        name: "Lid Massage",
        details: "After warm compress, gently massage eyelids in a circular motion to help express oils.",
        priority: "medium",
      },
    ],
  },
  {
    category: "Lid Hygiene",
    icon: Eye,
    description: "Keep your eyelids clean and healthy",
    items: [
      {
        name: "Eyelid Cleansing Wipes",
        details: "Use pre-moistened lid wipes (OCuSOFT, Systane Lid Wipes) daily to remove debris and bacteria.",
        priority: "high",
      },
      {
        name: "Baby Shampoo Scrub",
        details: "Alternative: Dilute baby shampoo, apply with cotton swab along lash line, rinse thoroughly.",
        priority: "low",
      },
    ],
  },
  {
    category: "Screen Habits",
    icon: Monitor,
    description: "Reduce digital eye strain",
    items: [
      {
        name: "20-20-20 Rule",
        details: "Every 20 minutes, look at something 20 feet away for 20 seconds. Set a timer as a reminder.",
        priority: "high",
      },
      {
        name: "Blink Reminders",
        details: "We blink 66% less when using screens. Make a conscious effort to blink fully and frequently.",
        priority: "medium",
      },
      {
        name: "Screen Position",
        details: "Position your screen slightly below eye level to reduce the exposed eye surface area.",
        priority: "medium",
      },
    ],
  },
  {
    category: "Environment",
    icon: Wind,
    description: "Optimize your surroundings",
    items: [
      {
        name: "Humidifier",
        details: "Use a humidifier in dry environments, especially during winter months with indoor heating.",
        priority: "medium",
      },
      {
        name: "Avoid Direct Airflow",
        details: "Position yourself away from fans, air vents, and air conditioning that blow directly on your face.",
        priority: "medium",
      },
    ],
  },
  {
    category: "Nutrition",
    icon: Fish,
    description: "Support eye health from within",
    items: [
      {
        name: "Omega-3 Supplements",
        details: "Take 1000-2000mg of fish oil or flaxseed oil daily. May take 2-3 months to see benefits.",
        priority: "medium",
      },
      {
        name: "Stay Hydrated",
        details: "Drink 8+ glasses of water daily. Dehydration worsens dry eye symptoms.",
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
            <span className="text-xl font-semibold text-primary-900">EyeCare</span>
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
              Your Treatment Recommendations
            </h1>
            <p className="text-gray-600">
              Over-the-counter treatments and lifestyle changes for dry eye relief
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
                    Give it time
                  </h3>
                  <p className="text-sm text-gray-700">
                    Most dry eye treatments take 2-4 weeks of consistent use to show
                    improvement. Be patient and stick with your routine.
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
                  Symptoms not improving?
                </h3>
                <p className="text-gray-600 mb-4">
                  If you&apos;ve tried these recommendations for 2-4 weeks without
                  relief, a consultation can help identify prescription options.
                </p>
                <Link href="/register">
                  <Button size="lg">
                    Book a Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              Want to track your progress?
            </p>
            <Link href="/assessment">
              <Button variant="ghost" size="sm">
                Retake Assessment in 4 Weeks
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
