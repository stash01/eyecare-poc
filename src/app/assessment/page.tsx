"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

const questions = [
  {
    id: 1,
    question: "How often do your eyes feel dry or uncomfortable?",
    context: "Think about a typical week — we want to understand your everyday experience.",
    options: [
      { label: "Never or rarely", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Almost constantly", value: 3 },
    ],
  },
  {
    id: 2,
    question: "Do your eyes ever feel gritty, like there's sand in them?",
    context: "This scratchy sensation is common and can be really bothersome.",
    options: [
      { label: "Never or rarely", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Almost constantly", value: 3 },
    ],
  },
  {
    id: 3,
    question: "How often do you experience burning or stinging in your eyes?",
    context: "This can range from mild irritation to significant discomfort.",
    options: [
      { label: "Never or rarely", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Almost constantly", value: 3 },
    ],
  },
  {
    id: 4,
    question: "Do your eyes feel tired or fatigued, even when you're not sleepy?",
    context: "Eye fatigue can make daily activities like reading or working feel exhausting.",
    options: [
      { label: "Never or rarely", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Almost constantly", value: 3 },
    ],
  },
  {
    id: 5,
    question: "Does your vision sometimes blur and then clear when you blink?",
    context: "Fluctuating vision can be frustrating and is often related to eye surface issues.",
    options: [
      { label: "Never or rarely", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Almost constantly", value: 3 },
    ],
  },
  {
    id: 6,
    question: "When your symptoms occur, how would you describe their intensity?",
    context: "There's no right answer here — everyone's experience is different.",
    options: [
      { label: "I don't really have symptoms", value: 0 },
      { label: "Mild — noticeable but manageable", value: 1 },
      { label: "Moderate — bothersome and distracting", value: 2 },
      { label: "Severe — significantly impacts my day", value: 3 },
    ],
  },
  {
    id: 7,
    question: "Do screens (computer, phone, TV) make your symptoms worse?",
    context: "Screen time is a major trigger for many people with dry eyes.",
    options: [
      { label: "Not noticeably", value: 0 },
      { label: "A little bit", value: 1 },
      { label: "Moderately", value: 2 },
      { label: "Significantly worse", value: 3 },
    ],
  },
  {
    id: 8,
    question: "Do air conditioning, heating, or dry environments affect your eyes?",
    context: "Environmental factors can play a big role in eye comfort.",
    options: [
      { label: "Not noticeably", value: 0 },
      { label: "A little bit", value: 1 },
      { label: "Moderately", value: 2 },
      { label: "Significantly worse", value: 3 },
    ],
  },
];

export default function AssessmentPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleNext = () => {
    if (selectedOption !== null) {
      const newAnswers = { ...answers, [question.id]: selectedOption };
      setAnswers(newAnswers);
      setSelectedOption(null);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        const nextAnswer = newAnswers[questions[currentQuestion + 1].id];
        if (nextAnswer !== undefined) {
          setSelectedOption(nextAnswer);
        }
      } else {
        const totalScore = Object.values(newAnswers).reduce((a, b) => a + b, 0);
        router.push(`/results?score=${totalScore}`);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const prevAnswer = answers[questions[currentQuestion - 1].id];
      setSelectedOption(prevAnswer !== undefined ? prevAnswer : null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">Klara</span>
          </Link>
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </nav>
      </header>

      <div className="container mx-auto px-4 mb-8">
        <div className="max-w-2xl mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            Almost there — you&apos;re doing great
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gray-900 leading-relaxed">
                {question.question}
              </CardTitle>
              <p className="text-gray-500 text-sm mt-2">
                {question.context}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-4">
                {question.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedOption(option.value)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedOption === option.value
                        ? "border-primary-600 bg-primary-50 text-primary-900"
                        : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentQuestion === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} disabled={selectedOption === null}>
                  {currentQuestion === questions.length - 1 ? "See My Results" : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Your responses are confidential and help us personalize your care</span>
          </div>
        </div>
      </main>
    </div>
  );
}
