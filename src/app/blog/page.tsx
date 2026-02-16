"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ArrowLeft, Clock, MessageCircle } from "lucide-react";
import Link from "next/link";

const samplePosts = [
  {
    title: "Understanding Dry Eye Disease: What Your Eyes Are Telling You",
    excerpt: "Learn about the different types of dry eye disease, their causes, and why early treatment matters for long-term eye health.",
    category: "Education",
    readTime: "5 min read",
    date: "Coming Soon",
  },
  {
    title: "The Role of Omega-3s in Managing Dry Eye Symptoms",
    excerpt: "New research shows how omega-3 fatty acids can improve tear film quality and reduce inflammation associated with dry eye.",
    category: "Research",
    readTime: "4 min read",
    date: "Coming Soon",
  },
  {
    title: "Screen Time and Your Eyes: Practical Tips for Digital Wellness",
    excerpt: "Discover evidence-based strategies to reduce digital eye strain and keep your eyes comfortable throughout the workday.",
    category: "Tips",
    readTime: "3 min read",
    date: "Coming Soon",
  },
  {
    title: "Living with Dry Eye: Stories from Our Community",
    excerpt: "Real patients share their experiences managing dry eye disease and the treatments that made the biggest difference.",
    category: "Community",
    readTime: "6 min read",
    date: "Coming Soon",
  },
];

const categoryColors: Record<string, string> = {
  Education: "bg-blue-100 text-blue-700",
  Research: "bg-purple-100 text-purple-700",
  Tips: "bg-green-100 text-green-700",
  Community: "bg-amber-100 text-amber-700",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Coming Soon Banner */}
          <div className="mb-8 p-6 bg-primary-50 border border-primary-200 rounded-xl text-center">
            <MessageCircle className="h-10 w-10 text-primary-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Blog &amp; Community
            </h1>
            <p className="text-gray-600 mb-1">
              Coming soon! We&apos;re building a space for expert articles, research updates, and community stories.
            </p>
            <p className="text-sm text-gray-500">
              Check back soon for content from our ophthalmology team.
            </p>
          </div>

          {/* Sample Posts */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview: Upcoming Articles</h2>
          <div className="space-y-4">
            {samplePosts.map((post, index) => (
              <Card key={index} className="hover:border-primary-300 transition-colors opacity-75">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${categoryColors[post.category]}`}>
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-600">{post.excerpt}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap mt-1">{post.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
