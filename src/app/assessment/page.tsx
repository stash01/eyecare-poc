"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ArrowLeft, Shield, AlertTriangle, Phone, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSymptomHistory } from "@/lib/symptom-history-context";
import {
  getFrequencySeverity,
  getIntensitySeverity,
  getRiskTier,
  countRiskFactors,
  getFinalSeverity,
  hasPriorTreatment,
} from "@/lib/assessment-utils";
import {
  OCULAR_CONDITIONS,
  CONTACT_LENS_OPTIONS,
  MEDICAL_CONDITIONS,
  SYMPTOMS,
  FREQUENCY_OPTIONS,
  TREATMENT_OPTIONS,
} from "@/lib/assessment-questions";

// ── Safety screening questions ───────────────────────────────────────────────
const SAFETY_QUESTIONS = [
  {
    id: "vision_loss",
    question: "Have you experienced significant sudden and permanent vision loss?",
    context:
      "Significant sudden and permanent vision loss refers to a rapid decline in vision that has not recovered. Answer to the best of your knowledge.",
    options: ["Yes", "No", "Unsure"] as const,
    redFlagValues: ["Yes", "Unsure"],
  },
  {
    id: "eye_pain",
    question: "Do you have severe eye pain?",
    context: "Severe eye pain means intense or debilitating pain in or around the eye.",
    options: ["Yes", "No", "Occasional / Intermittent"] as const,
    redFlagValues: ["Yes"],
  },
  {
    id: "trauma",
    question: "Any recent ocular trauma?",
    context:
      "Include any recent injuries to the eye(s) such as blunt force, cuts, chemical exposure, or foreign body incidents.",
    options: ["Yes", "No", "Unsure"] as const,
    redFlagValues: ["Yes", "Unsure"],
  },
] as const;

const SECTION_TITLES = [
  "Past Ocular History",
  "Past Medical History",
  "Symptom Frequency",
  "Symptom Intensity",
  "Past Treatments (Tried & Failed)",
  "Current Treatments",
  "Additional Comments",
];

const TOTAL_STEPS = SAFETY_QUESTIONS.length + SECTION_TITLES.length; // 10

type Phase = "safety" | "sections" | "referral";

interface FormData {
  ocularConditions: string[];
  ocularDetails: string;
  contactLensUse: string;
  medicalConditions: string[];
  medicalDetails: string;
  medications: string;
  symptomFrequencies: Record<string, number>;
  symptomIntensities: Record<string, number>;
  pastFailedTreatments: string[];
  pastTreatmentDetails: string;
  currentTreatments: string[];
  currentTreatmentDetails: string;
  additionalComments: string;
}

// ── Checkbox card ────────────────────────────────────────────────────────────
function CheckboxCard({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
        checked
          ? "border-primary-600 bg-primary-50 text-primary-900"
          : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
      }`}
    >
      <div
        className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center ${
          checked ? "bg-primary-600 border-primary-600" : "border-gray-300"
        }`}
      >
        {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// ── Radio card (single-select) ───────────────────────────────────────────────
function RadioCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
        selected
          ? "border-primary-600 bg-primary-50 text-primary-900"
          : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center ${
          selected ? "border-primary-600" : "border-gray-300"
        }`}
      >
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// ── Section card renderer ────────────────────────────────────────────────────
function SectionCard({
  step,
  formData,
  setFormData,
  onBack,
  onNext,
  isLastSection,
  isSubmitting,
}: {
  step: number;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onBack: () => void;
  onNext: () => void;
  isLastSection: boolean;
  isSubmitting: boolean;
}) {
  function toggleMultiSelect(
    field: "ocularConditions" | "medicalConditions" | "pastFailedTreatments" | "currentTreatments",
    value: string,
    exclusiveValue = "none"
  ) {
    setFormData((prev) => {
      const current = prev[field];
      if (value === exclusiveValue) {
        return { ...prev, [field]: current.includes(value) ? [] : [value] };
      }
      const withoutExclusive = current.filter((v) => v !== exclusiveValue);
      const next = withoutExclusive.includes(value)
        ? withoutExclusive.filter((v) => v !== value)
        : [...withoutExclusive, value];
      return { ...prev, [field]: next };
    });
  }

  // Section 0 — Ocular History
  const showOcularDetails =
    formData.ocularConditions.includes("eye_surgery") ||
    formData.ocularConditions.includes("other_ocular");

  // Section 1 — Medical History
  const showMedicalDetails = formData.medicalConditions.includes("other_medical");

  // Section 4/5 — Treatment details
  const showPastTreatmentDetails =
    formData.pastFailedTreatments.includes("steroid_drops") ||
    formData.pastFailedTreatments.includes("other_treatment");
  const showCurrentTreatmentDetails =
    formData.currentTreatments.includes("steroid_drops") ||
    formData.currentTreatments.includes("other_treatment");

  // Section 2 — frequency validation: all 6 symptoms must be answered
  const allFrequenciesAnswered = SYMPTOMS.every(
    (s) => formData.symptomFrequencies[s.key] !== undefined
  );

  const canAdvance =
    step === 0
      ? formData.contactLensUse !== ""
      : step === 2
      ? allFrequenciesAnswered
      : true;

  const sectionContent = () => {
    // ── Section 0: Ocular History ──────────────────────────────────────────
    if (step === 0) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Known past or current ocular conditions</h3>
            <p className="text-sm text-gray-500 mb-3">Select all that apply.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OCULAR_CONDITIONS.map((opt) => (
                <CheckboxCard
                  key={opt.value}
                  label={opt.label}
                  checked={formData.ocularConditions.includes(opt.value)}
                  onClick={() => toggleMultiSelect("ocularConditions", opt.value, "none")}
                />
              ))}
            </div>
            {showOcularDetails && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Please provide details (diagnosis name, approximate dates, treatments)
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  value={formData.ocularDetails}
                  onChange={(e) => setFormData((p) => ({ ...p, ocularDetails: e.target.value }))}
                  placeholder="e.g. Cataract surgery — left eye, 2023"
                />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Are you a contact lens wearer?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONTACT_LENS_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  label={opt.label}
                  selected={formData.contactLensUse === opt.value}
                  onClick={() => setFormData((p) => ({ ...p, contactLensUse: opt.value }))}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── Section 1: Medical History ─────────────────────────────────────────
    if (step === 1) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Known past or current medical conditions</h3>
            <p className="text-sm text-gray-500 mb-3">Select all that apply.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MEDICAL_CONDITIONS.map((opt) => (
                <CheckboxCard
                  key={opt.value}
                  label={opt.label}
                  checked={formData.medicalConditions.includes(opt.value)}
                  onClick={() => toggleMultiSelect("medicalConditions", opt.value, "none")}
                />
              ))}
            </div>
            {showMedicalDetails && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Please provide details
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  value={formData.medicalDetails}
                  onChange={(e) => setFormData((p) => ({ ...p, medicalDetails: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Medication list</h3>
            <p className="text-sm text-gray-500 mb-2">
              List any current medications (prescription and over-the-counter).
            </p>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              value={formData.medications}
              onChange={(e) => setFormData((p) => ({ ...p, medications: e.target.value }))}
              placeholder="e.g. Metformin 500mg, Levothyroxine 50mcg..."
            />
          </div>
        </div>
      );
    }

    // ── Section 2: Symptom Frequency ──────────────────────────────────────
    if (step === 2) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            For each symptom, indicate how often you experience it in a typical day.
          </p>
          {SYMPTOMS.map((symptom) => {
            const current = formData.symptomFrequencies[symptom.key];
            return (
              <div key={symptom.key} className="border rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-3">{symptom.label}</p>
                <div className="flex flex-wrap gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          symptomFrequencies: { ...p.symptomFrequencies, [symptom.key]: opt.value },
                        }))
                      }
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        current === opt.value
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-gray-200 hover:border-primary-300 text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // ── Section 3: Symptom Intensity ──────────────────────────────────────
    if (step === 3) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Rate the intensity of each symptom when you experience it (0 = none, 10 = worst imaginable).
            If you never experience a symptom, leave it at 0.
          </p>
          {SYMPTOMS.map((symptom) => {
            const val = formData.symptomIntensities[symptom.key] ?? 0;
            return (
              <div key={symptom.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-gray-900">{symptom.label}</p>
                  <span
                    className={`text-2xl font-bold w-10 text-right ${
                      val === 0
                        ? "text-gray-400"
                        : val <= 3
                        ? "text-green-600"
                        : val <= 6
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {val}
                  </span>
                </div>
                <div className="relative py-1">
                  {/* Gradient track: green → yellow → red */}
                  <div
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to right, #22c55e 0%, #eab308 45%, #ef4444 100%)",
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={val}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        symptomIntensities: {
                          ...p.symptomIntensities,
                          [symptom.key]: parseInt(e.target.value),
                        },
                      }))
                    }
                    className="relative w-full h-2 cursor-pointer appearance-none bg-transparent
                      [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent
                      [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-300 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>None</span>
                  <span>Worst imaginable</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // ── Sections 4 & 5: Treatments ────────────────────────────────────────
    if (step === 4 || step === 5) {
      const isPast = step === 4;
      const field = isPast ? "pastFailedTreatments" : "currentTreatments";
      const detailsField = isPast ? "pastTreatmentDetails" : "currentTreatmentDetails";
      const showDetails = isPast ? showPastTreatmentDetails : showCurrentTreatmentDetails;
      const values = formData[field];
      const description = isPast
        ? "Select all treatments you have tried that did not provide sufficient relief."
        : "Select all treatments you are currently using.";

      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TREATMENT_OPTIONS.map((opt) => (
              <CheckboxCard
                key={opt.value}
                label={opt.label}
                checked={values.includes(opt.value)}
                onClick={() => toggleMultiSelect(field, opt.value, "none")}
              />
            ))}
          </div>
          {showDetails && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Please specify (steroid name / other details)
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
                value={formData[detailsField]}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, [detailsField]: e.target.value }))
                }
              />
            </div>
          )}
        </div>
      );
    }

    // ── Section 6: Additional Comments ────────────────────────────────────
    if (step === 6) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Include any additional details that might help us understand your symptoms (e.g. onset,
            triggers, recent surgeries, contact lens details).
          </p>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={6}
            value={formData.additionalComments}
            onChange={(e) => setFormData((p) => ({ ...p, additionalComments: e.target.value }))}
            placeholder="Optional — any context that may be relevant..."
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-gray-900">{SECTION_TITLES[step]}</CardTitle>
      </CardHeader>
      <CardContent>
        {sectionContent()}

        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={onNext}
            disabled={!canAdvance || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLastSection ? (
              "Submit"
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Referral screen ──────────────────────────────────────────────────────────
function ReferralScreen({
  redFlags,
  onRetake,
}: {
  redFlags: string[];
  onRetake: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center">
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
                Based on your responses, we recommend you see an eye care professional or visit an
                emergency department. KlaraMD&apos;s virtual care pathway is not appropriate for your
                current symptoms.
              </p>

              {redFlags.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Responses requiring in-person care:</h3>
                  <ul className="space-y-2">
                    {redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  If you&apos;re experiencing an emergency
                </h3>
                <p className="text-sm text-red-700">
                  Sudden vision loss, severe eye pain, or chemical exposure require immediate care.
                  Please go to your nearest emergency room or call 911.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button variant="secondary" onClick={onRetake}>
                  Retake Screening
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="w-full">
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

// ── Main page ────────────────────────────────────────────────────────────────
export default function AssessmentPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { addResult } = useSymptomHistory();

  const [phase, setPhase] = useState<Phase>("safety");
  const [safetyStep, setSafetyStep] = useState(0);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [sectionStep, setSectionStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    ocularConditions: [],
    ocularDetails: "",
    contactLensUse: "",
    medicalConditions: [],
    medicalDetails: "",
    medications: "",
    symptomFrequencies: {},
    symptomIntensities: Object.fromEntries(SYMPTOMS.map((s) => [s.key, 0])),
    pastFailedTreatments: [],
    pastTreatmentDetails: "",
    currentTreatments: [],
    currentTreatmentDetails: "",
    additionalComments: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/register");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  if (phase === "referral") {
    return (
      <ReferralScreen
        redFlags={redFlags}
        onRetake={() => {
          setPhase("safety");
          setSafetyStep(0);
          setRedFlags([]);
        }}
      />
    );
  }

  const currentStep =
    phase === "safety" ? safetyStep + 1 : SAFETY_QUESTIONS.length + sectionStep + 1;
  const progress = (currentStep / TOTAL_STEPS) * 100;

  function handleSafetyAnswer(answer: string) {
    const q = SAFETY_QUESTIONS[safetyStep];
    const isRedFlag = (q.redFlagValues as readonly string[]).includes(answer);
    const newFlags = isRedFlag ? [...redFlags, q.question] : redFlags;

    if (isRedFlag) setRedFlags(newFlags);

    if (safetyStep < SAFETY_QUESTIONS.length - 1) {
      setSafetyStep(safetyStep + 1);
    } else {
      if (newFlags.length > 0) {
        setPhase("referral");
      } else {
        setPhase("sections");
      }
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const freqScore = SYMPTOMS.reduce(
        (sum, s) => sum + (formData.symptomFrequencies[s.key] ?? 0),
        0
      );
      const intScore = SYMPTOMS.reduce(
        (sum, s) => sum + (formData.symptomIntensities[s.key] ?? 0),
        0
      );
      const freqSev = getFrequencySeverity(freqScore);
      const intSev = getIntensitySeverity(intScore);
      const rfCount = countRiskFactors({
        medicalConditions: formData.medicalConditions,
        ocularConditions: formData.ocularConditions,
        contactLensUse: formData.contactLensUse,
        pastFailedTreatments: formData.pastFailedTreatments,
      });
      const riskTier = getRiskTier(rfCount);
      const severity = getFinalSeverity(freqSev, intSev, riskTier);
      const priorTreatment = hasPriorTreatment(formData.pastFailedTreatments);

      await addResult({
        frequencyScore: freqScore,
        intensityScore: intScore,
        frequencySeverity: freqSev,
        intensitySeverity: intSev,
        riskFactorCount: rfCount,
        riskTier,
        severity,
        priorTreatment,
        symptomFrequencies: formData.symptomFrequencies,
        symptomIntensities: formData.symptomIntensities,
        ocularConditions: formData.ocularConditions,
        medicalConditions: formData.medicalConditions,
        pastFailedTreatments: formData.pastFailedTreatments,
        currentTreatments: formData.currentTreatments,
        rawAnswers: formData as unknown as Record<string, unknown>,
      });

      const params = new URLSearchParams({
        frequencyScore: freqScore.toString(),
        intensityScore: intScore.toString(),
        frequencySeverity: freqSev,
        intensitySeverity: intSev,
        riskFactorCount: rfCount.toString(),
        riskTier,
        severity,
        priorTreatment: priorTreatment.toString(),
      });
      router.push(`/subscribe?${params.toString()}`);
    } catch (err) {
      console.error("[assessment] submit error:", err);
      setIsSubmitting(false);
    }
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
            Step {currentStep} of {TOTAL_STEPS}
          </span>
        </nav>
      </header>

      {/* Progress bar */}
      <div className="container mx-auto px-4 mb-8">
        <div className="max-w-2xl mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {phase === "safety" ? "Safety screening" : SECTION_TITLES[sectionStep]}
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          {phase === "safety" ? (
            // Safety question — one at a time
            <Card className="border-0 shadow-lg border-l-4 border-l-amber-400">
              <CardHeader className="pb-2">
                <div className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">
                  Safety Screening
                </div>
                <CardTitle className="text-xl text-gray-900 leading-relaxed">
                  {SAFETY_QUESTIONS[safetyStep].question}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {SAFETY_QUESTIONS[safetyStep].context}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-4">
                  {SAFETY_QUESTIONS[safetyStep].options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSafetyAnswer(option)}
                      className="w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-all font-medium text-gray-800"
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div className="flex justify-start mt-8 pt-6 border-t">
                  <Button
                    variant="ghost"
                    onClick={() => safetyStep > 0 && setSafetyStep(safetyStep - 1)}
                    disabled={safetyStep === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SectionCard
              step={sectionStep}
              formData={formData}
              setFormData={setFormData}
              onBack={() => {
                if (sectionStep > 0) setSectionStep(sectionStep - 1);
                else {
                  setPhase("safety");
                  setSafetyStep(SAFETY_QUESTIONS.length - 1);
                }
              }}
              onNext={() => {
                if (sectionStep < SECTION_TITLES.length - 1) {
                  setSectionStep(sectionStep + 1);
                } else {
                  handleSubmit();
                }
              }}
              isLastSection={sectionStep === SECTION_TITLES.length - 1}
              isSubmitting={isSubmitting}
            />
          )}

          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Your responses are encrypted and stored securely (PHIPA compliant)</span>
          </div>
        </div>
      </main>
    </div>
  );
}
