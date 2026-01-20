"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

const questions = [
  {
    id: 1,
    question: "How often do your eyes feel DRY or uncomfortable?",
    options: [
      { label: "Never", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Constantly", value: 3 },
    ],
  },
  {
    id: 2,
    question: "How often do your eyes feel GRITTY or sandy?",
    options: [
      { label: "Never", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Constantly", value: 3 },
    ],
  },
  {
    id: 3,
    question: "How often do your eyes have a BURNING or stinging sensation?",
    options: [
      { label: "Never", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Constantly", value: 3 },
    ],
  },
  {
    id: 4,
    question: "How often do your eyes feel TIRED or fatigued?",
    options: [
      { label: "Never", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Constantly", value: 3 },
    ],
  },
  {
    id: 5,
    question: "How often is your vision BLURRY or fluctuating?",
    options: [
      { label: "Never", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Constantly", value: 3 },
    ],
  },
  {
    id: 6,
    question: "How SEVERE are your symptoms when they occur?",
    options: [
      { label: "Not applicable", value: 0 },
      { label: "Mild - noticeable but not bothersome", value: 1 },
      { label: "Moderate - bothersome but tolerable", value: 2 },
      { label: "Severe - difficult to tolerate", value: 3 },
    ],
  },
  {
    id: 7,
    question: "Do your symptoms worsen with SCREEN USE (computer, phone, TV)?",
    options: [
      { label: "No", value: 0 },
      { label: "Slightly", value: 1 },
      { label: "Moderately", value: 2 },
      { label: "Significantly", value: 3 },
    ],
  },
  {
    id: 8,
    question: "Do your symptoms worsen in AIR CONDITIONED or heated environments?",
    options: [
      { label: "No", value: 0 },
      { label: "Slightly", value: 1 },
      { label: "Moderately", value: 2 },
      { label: "Significantly", value: 3 },
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
            <span className="text-xl font-semibold text-primary-900">EyeCare</span>
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
        </div>
      </div>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-gray-900 leading-relaxed">
                {question.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                  {currentQuestion === questions.length - 1 ? "See Results" : "Next"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500 mt-6">
            Your responses are confidential and help us provide personalized recommendations.
          </p>
        </div>
      </main>
    </div>
  );
}
