"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ArrowRight, ArrowLeft, Shield, AlertTriangle, Phone, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSeverity } from "@/lib/assessment-utils";
import { useSymptomHistory } from "@/lib/symptom-history-context";

// Phase 1: Safety screening questions (pathology red flags)
const screeningQuestions = [
  {
    id: "s1",
    question: "Have you experienced any sudden vision loss or sudden changes in your vision?",
    context: "This includes sudden blurriness, dark spots, flashes of light, or floating spots that appeared recently.",
    redFlag: true,
    options: [
      { label: "No", value: 0, isRedFlag: false },
      { label: "Yes, in the past few days", value: 1, isRedFlag: true },
      { label: "Yes, in the past few weeks", value: 1, isRedFlag: true },
    ],
  },
  {
    id: "s2",
    question: "Are you experiencing significant eye pain (not just discomfort or irritation)?",
    context: "We mean sharp, aching, or throbbing pain — not the mild burning or grittiness typical of dry eye.",
    redFlag: true,
    options: [
      { label: "No, just mild discomfort or irritation", value: 0, isRedFlag: false },
      { label: "Yes, moderate pain", value: 1, isRedFlag: true },
      { label: "Yes, severe pain", value: 2, isRedFlag: true },
    ],
  },
  {
    id: "s3",
    question: "Have you had any recent eye injury, trauma, or chemical exposure?",
    context: "This includes being poked in the eye, foreign objects, or exposure to chemicals or irritants.",
    redFlag: true,
    options: [
      { label: "No", value: 0, isRedFlag: false },
      { label: "Yes, minor incident that's healing", value: 1, isRedFlag: true },
      { label: "Yes, recent or ongoing issue", value: 2, isRedFlag: true },
    ],
  },
  {
    id: "s4",
    question: "Do you have discharge from your eyes (yellow, green, or thick white)?",
    context: "Clear or slightly watery discharge is common with dry eye. We're asking about colored or thick discharge.",
    redFlag: true,
    options: [
      { label: "No, or just clear/watery", value: 0, isRedFlag: false },
      { label: "Yes, some colored or thick discharge", value: 1, isRedFlag: true },
      { label: "Yes, significant discharge", value: 2, isRedFlag: true },
    ],
  },
  {
    id: "s5",
    question: "Have you had eye surgery in the past 3 months?",
    context: "Including LASIK, cataract surgery, or any other eye procedure.",
    redFlag: true,
    options: [
      { label: "No", value: 0, isRedFlag: false },
      { label: "Yes, and healing normally", value: 0, isRedFlag: false },
      { label: "Yes, and having unexpected symptoms", value: 1, isRedFlag: true },
    ],
  },
  {
    id: "s6",
    question: "Do you have a history of herpes simplex eye infection (ocular herpes)?",
    context: "This condition requires specialized monitoring and treatment approaches.",
    redFlag: true,
    options: [
      { label: "No", value: 0, isRedFlag: false },
      { label: "Yes, but no current symptoms", value: 0, isRedFlag: false },
      { label: "Yes, with current or recent symptoms", value: 1, isRedFlag: true },
    ],
  },
  {
    id: "s7",
    question: "Do you wear contact lenses and have redness, pain, or vision changes while wearing them?",
    context: "Contact lens complications can sometimes require urgent attention.",
    redFlag: true,
    options: [
      { label: "I don't wear contact lenses", value: 0, isRedFlag: false },
      { label: "I wear them with no concerning issues", value: 0, isRedFlag: false },
      { label: "Yes, I'm having problems with my contacts", value: 1, isRedFlag: true },
    ],
  },
];

// Phase 2: DEWS3-aligned symptom assessment
// Based on DEQ-5 (Dry Eye Questionnaire-5) and OSDI principles
const dewsQuestions = [
  // DEQ-5 Core Questions
  {
    id: 1,
    category: "DEQ-5",
    question: "During a typical day in the past month, how often did your eyes feel discomfort?",
    context: "Based on the validated DEQ-5 questionnaire used in clinical dry eye diagnosis.",
    options: [
      { label: "Never", value: 0 },
      { label: "Rarely", value: 1 },
      { label: "Sometimes", value: 2 },
      { label: "Frequently", value: 3 },
      { label: "Constantly", value: 4 },
    ],
  },
  {
    id: 2,
    category: "DEQ-5",
    question: "When your eyes felt discomfort, how intense was this feeling at the end of the day?",
    context: "Rate from very mild to very intense.",
    options: [
      { label: "Not applicable / Never had discomfort", value: 0 },
      { label: "Not at all intense", value: 1 },
      { label: "Somewhat intense", value: 2 },
      { label: "Very intense", value: 3 },
    ],
  },
  {
    id: 3,
    category: "DEQ-5",
    question: "During a typical day in the past month, how often did your eyes feel dry?",
    context: "Think about feelings of dryness, not just discomfort.",
    options: [
      { label: "Never", value: 0 },
      { label: "Rarely", value: 1 },
      { label: "Sometimes", value: 2 },
      { label: "Frequently", value: 3 },
      { label: "Constantly", value: 4 },
    ],
  },
  {
    id: 4,
    category: "DEQ-5",
    question: "When your eyes felt dry, how intense was this feeling at the end of the day?",
    context: "Rate from very mild to very intense.",
    options: [
      { label: "Not applicable / Never felt dry", value: 0 },
      { label: "Not at all intense", value: 1 },
      { label: "Somewhat intense", value: 2 },
      { label: "Very intense", value: 3 },
    ],
  },
  {
    id: 5,
    category: "DEQ-5",
    question: "During a typical day in the past month, how often did your eyes look or feel excessively watery?",
    context: "Paradoxically, watery eyes can be a sign of dry eye disease.",
    options: [
      { label: "Never", value: 0 },
      { label: "Rarely", value: 1 },
      { label: "Sometimes", value: 2 },
      { label: "Frequently", value: 3 },
      { label: "Constantly", value: 4 },
    ],
  },
  // OSDI-inspired Visual Function Questions
  {
    id: 6,
    category: "OSDI-Visual",
    question: "In the past week, have your eyes caused you to have blurred or fluctuating vision?",
    context: "Vision that comes and goes, especially improving with blinking.",
    options: [
      { label: "None of the time", value: 0 },
      { label: "Some of the time", value: 1 },
      { label: "Half of the time", value: 2 },
      { label: "Most of the time", value: 3 },
      { label: "All of the time", value: 4 },
    ],
  },
  {
    id: 7,
    category: "OSDI-Visual",
    question: "In the past week, have your eyes limited your ability to read, drive, or use screens?",
    context: "Impact on daily activities requiring visual focus.",
    options: [
      { label: "None of the time", value: 0 },
      { label: "Some of the time", value: 1 },
      { label: "Half of the time", value: 2 },
      { label: "Most of the time", value: 3 },
      { label: "All of the time", value: 4 },
    ],
  },
  // OSDI-inspired Environmental Triggers
  {
    id: 8,
    category: "OSDI-Environmental",
    question: "In the past week, have your eyes felt uncomfortable in windy conditions?",
    context: "Environmental sensitivity is a key DEWS3 diagnostic criterion.",
    options: [
      { label: "Not applicable / Not exposed", value: 0 },
      { label: "None of the time", value: 0 },
      { label: "Some of the time", value: 1 },
      { label: "Half of the time", value: 2 },
      { label: "Most of the time", value: 3 },
      { label: "All of the time", value: 4 },
    ],
  },
  {
    id: 9,
    category: "OSDI-Environmental",
    question: "In the past week, have your eyes felt uncomfortable in air conditioned or heated rooms?",
    context: "Low humidity environments often trigger dry eye symptoms.",
    options: [
      { label: "Not applicable / Not exposed", value: 0 },
      { label: "None of the time", value: 0 },
      { label: "Some of the time", value: 1 },
      { label: "Half of the time", value: 2 },
      { label: "Most of the time", value: 3 },
      { label: "All of the time", value: 4 },
    ],
  },
  // Risk Factor Assessment
  {
    id: 10,
    category: "Risk-Factors",
    question: "Do you have any autoimmune conditions (e.g., Sjogren's, rheumatoid arthritis, lupus)?",
    context: "Autoimmune conditions are strongly associated with aqueous-deficient dry eye.",
    options: [
      { label: "No", value: 0, flag: "autoimmune" },
      { label: "Yes, well-controlled", value: 1, flag: "autoimmune" },
      { label: "Yes, with active symptoms", value: 2, flag: "autoimmune" },
    ],
  },
  {
    id: 11,
    category: "Risk-Factors",
    question: "Have you been diagnosed with diabetes?",
    context: "Diabetes affects corneal nerves and tear production.",
    options: [
      { label: "No", value: 0, flag: "diabetes" },
      { label: "Pre-diabetes or well-controlled", value: 1, flag: "diabetes" },
      { label: "Yes, with complications", value: 2, flag: "diabetes" },
    ],
  },
  {
    id: 12,
    category: "MGD-Indicators",
    question: "Do you notice crusting, stickiness, or debris on your eyelids, especially in the morning?",
    context: "These are hallmark signs of meibomian gland dysfunction (evaporative dry eye).",
    options: [
      { label: "Never", value: 0, flag: "mgd" },
      { label: "Occasionally", value: 1, flag: "mgd" },
      { label: "Frequently", value: 2, flag: "mgd" },
      { label: "Every day", value: 3, flag: "mgd" },
    ],
  },
  {
    id: 13,
    category: "MGD-Indicators",
    question: "Do you experience a gritty, sandy, or foreign body sensation in your eyes?",
    context: "This sensation often indicates tear film instability or MGD.",
    options: [
      { label: "Never", value: 0 },
      { label: "Occasionally", value: 1 },
      { label: "Frequently", value: 2 },
      { label: "Constantly", value: 3 },
    ],
  },
  {
    id: 14,
    category: "Treatment-History",
    question: "What treatments have you tried for dry eye symptoms?",
    context: "Understanding your treatment history helps us recommend next steps.",
    options: [
      { label: "None yet", value: 0, flag: "treatment" },
      { label: "OTC artificial tears occasionally", value: 1, flag: "treatment" },
      { label: "Regular OTC drops, warm compresses, lid hygiene", value: 2, flag: "treatment" },
      { label: "Prescription treatments or multiple approaches without relief", value: 3, flag: "treatment" },
    ],
  },
];

type Phase = "screening" | "assessment" | "referral";

export default function AssessmentPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { addResult } = useSymptomHistory();
  const [phase, setPhase] = useState<Phase>("screening");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, number>>({});
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [redFlagsDetected, setRedFlagsDetected] = useState<string[]>([]);

  // Redirect to register if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/register");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render assessment if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const questions = phase === "screening" ? screeningQuestions : dewsQuestions;
  const totalQuestions = questions.length;
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const handleNext = () => {
    if (selectedOption === null) return;

    if (phase === "screening") {
      const screeningQ = question as typeof screeningQuestions[number];
      const newAnswers = { ...screeningAnswers, [screeningQ.id]: selectedOption };
      setScreeningAnswers(newAnswers);

      // Check for red flags
      const selectedOpt = screeningQ.options[selectedOption];
      if (selectedOpt?.isRedFlag) {
        setRedFlagsDetected(prev => [...prev, screeningQ.question]);
      }

      setSelectedOption(null);

      if (currentQuestion < screeningQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Finished screening - check if any red flags
        const allRedFlags = [...redFlagsDetected];
        const currentOpt = screeningQ.options[selectedOption];
        if (currentOpt?.isRedFlag) {
          allRedFlags.push(screeningQ.question);
        }

        if (allRedFlags.length > 0) {
          setPhase("referral");
        } else {
          // Move to DEWS assessment
          setPhase("assessment");
          setCurrentQuestion(0);
        }
      }
    } else if (phase === "assessment") {
      const dewsQ = question as typeof dewsQuestions[number];
      const newAnswers = { ...assessmentAnswers, [dewsQ.id]: selectedOption };
      setAssessmentAnswers(newAnswers);
      setSelectedOption(null);

      if (currentQuestion < dewsQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        const nextAnswer = newAnswers[dewsQuestions[currentQuestion + 1].id];
        if (nextAnswer !== undefined) {
          setSelectedOption(nextAnswer);
        }
      } else {
        // Calculate scores and navigate to results
        const deq5Score = (newAnswers[1] || 0) + (newAnswers[2] || 0) + (newAnswers[3] || 0) +
                         (newAnswers[4] || 0) + (newAnswers[5] || 0);
        const osdiVisualScore = (newAnswers[6] || 0) + (newAnswers[7] || 0);
        const osdiEnvScore = (newAnswers[8] || 0) + (newAnswers[9] || 0);
        const symptomScore = (newAnswers[12] || 0) + (newAnswers[13] || 0);

        const totalScore = deq5Score + osdiVisualScore + osdiEnvScore + symptomScore;

        // Calculate flags
        const hasAutoimmune = (newAnswers[10] || 0) >= 1;
        const hasDiabetes = (newAnswers[11] || 0) >= 1;
        const hasMGD = (newAnswers[12] || 0) >= 2;
        const hasTriedTreatments = (newAnswers[14] || 0) >= 2;

        // DEQ-5 cutoff: score >= 6 suggests dry eye (per DEWS II)
        const deq5Positive = deq5Score >= 6;

        const riskFactorCount = [hasAutoimmune, hasDiabetes, hasTriedTreatments, hasMGD].filter(Boolean).length;
        const severity = getSeverity(totalScore, deq5Score, deq5Positive, riskFactorCount);

        addResult({
          score: totalScore,
          deq5: deq5Score,
          deq5Positive,
          severity,
          autoimmune: hasAutoimmune,
          diabetes: hasDiabetes,
          mgd: hasMGD,
          triedTreatments: hasTriedTreatments,
        });

        const params = new URLSearchParams({
          score: totalScore.toString(),
          deq5: deq5Score.toString(),
          deq5Positive: deq5Positive.toString(),
          autoimmune: hasAutoimmune.toString(),
          diabetes: hasDiabetes.toString(),
          mgd: hasMGD.toString(),
          triedTreatments: hasTriedTreatments.toString(),
        });
        router.push(`/subscribe?${params.toString()}`);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      if (phase === "screening") {
        const prevAnswer = screeningAnswers[screeningQuestions[currentQuestion - 1].id];
        setSelectedOption(prevAnswer !== undefined ? prevAnswer : null);
      } else {
        const prevAnswer = assessmentAnswers[dewsQuestions[currentQuestion - 1].id];
        setSelectedOption(prevAnswer !== undefined ? prevAnswer : null);
      }
    } else if (phase === "assessment") {
      // Go back to last screening question
      setPhase("screening");
      setCurrentQuestion(screeningQuestions.length - 1);
      const lastScreeningAnswer = screeningAnswers[screeningQuestions[screeningQuestions.length - 1].id];
      setSelectedOption(lastScreeningAnswer !== undefined ? lastScreeningAnswer : null);
    }
  };

  // Referral screen for patients who need in-person care
  if (phase === "referral") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
            </Link>
          </nav>
        </header>

        <main className="container mx-auto px-4 pb-20">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-amber-300 bg-amber-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl text-amber-800">
                    In-Person Evaluation Recommended
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-700">
                  Based on your responses, we recommend you see an eye care professional in person
                  for a comprehensive examination. Some of your symptoms may require diagnostic tests
                  or treatments that can only be performed during an in-person visit.
                </p>

                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Symptoms requiring in-person care:</h3>
                  <ul className="space-y-2">
                    {redFlagsDetected.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    If you're experiencing an emergency:
                  </h3>
                  <p className="text-sm text-red-700">
                    Sudden vision loss, severe eye pain, or chemical exposure require immediate care.
                    Please go to your nearest emergency room or call 911.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Next steps:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary-600">1.</span>
                      Contact your regular ophthalmologist or optometrist for an appointment
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary-600">2.</span>
                      If you don't have a regular eye doctor, we can help connect you with one
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary-600">3.</span>
                      Describe the symptoms you reported here to your eye care provider
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Link href="/register">
                    <Button size="lg" className="w-full">
                      Find an Ophthalmologist Near Me
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      setPhase("screening");
                      setCurrentQuestion(0);
                      setScreeningAnswers({});
                      setRedFlagsDetected([]);
                      setSelectedOption(null);
                    }}
                  >
                    Retake Screening
                  </Button>
                  <Link href="/">
                    <Button variant="ghost" size="lg" className="w-full">
                      Return to Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
          </Link>
          <span className="text-sm text-gray-500">
            {phase === "screening" ? "Safety Screening" : "Symptom Assessment"} — Question {currentQuestion + 1} of {totalQuestions}
          </span>
        </nav>
      </header>

      <div className="container mx-auto px-4 mb-8">
        <div className="max-w-2xl mx-auto">
          {/* Phase indicator */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`flex items-center gap-2 ${phase === "screening" ? "text-primary-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                phase === "screening" ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>1</div>
              <span className="text-sm font-medium">Safety Check</span>
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={`flex items-center gap-2 ${phase === "assessment" ? "text-primary-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                phase === "assessment" ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>2</div>
              <span className="text-sm font-medium">DEWS3 Assessment</span>
            </div>
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {phase === "screening"
              ? "First, let's make sure virtual care is right for you"
              : "Now let's assess your dry eye symptoms using clinically validated questions"}
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <Card className={`border-0 shadow-lg ${phase === "screening" ? "border-l-4 border-l-amber-400" : ""}`}>
            <CardHeader className="pb-2">
              {phase === "assessment" && (
                <div className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-2">
                  {(question as typeof dewsQuestions[number]).category?.replace("-", " • ")}
                </div>
              )}
              <CardTitle className="text-2xl text-gray-900 leading-relaxed">
                {question.question}
              </CardTitle>
              <p className="text-gray-500 text-sm mt-2">
                {question.context}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-4">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedOption === index
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
                  disabled={currentQuestion === 0 && phase === "screening"}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} disabled={selectedOption === null}>
                  {phase === "assessment" && currentQuestion === dewsQuestions.length - 1
                    ? "See My Results"
                    : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>
              {phase === "screening"
                ? "These questions help ensure you receive appropriate care"
                : "Based on TFOS DEWS II clinical guidelines"}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
