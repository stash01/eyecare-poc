export type Severity = "mild" | "moderate" | "severe";
export type RiskTier = "low" | "moderate" | "high";

export interface TreatmentPathway {
  firstLine: string[];
  poorResponse: string[];
}

// ── Frequency scoring (0–24) ────────────────────────────────────────────────
export function getFrequencySeverity(score: number): Severity {
  if (score <= 4) return "mild";
  if (score <= 12) return "moderate";
  return "severe";
}

// ── Intensity scoring (0–60) ────────────────────────────────────────────────
export function getIntensitySeverity(score: number): Severity {
  if (score <= 15) return "mild";
  if (score <= 29) return "moderate";
  return "severe";
}

// ── Risk tier ───────────────────────────────────────────────────────────────
export function getRiskTier(count: number): RiskTier {
  if (count <= 1) return "low";
  if (count <= 4) return "moderate";
  return "high";
}

const PRESCRIPTION_RISK_TREATMENTS = [
  "restasis", "xiidra", "cequa", "serum_tears",
  "punctal_plugs", "lipiflow", "ipl_rf",
];

export function countRiskFactors(data: {
  medicalConditions: string[];
  ocularConditions: string[];
  contactLensUse: string;
  pastFailedTreatments: string[];
}): number {
  let count = 0;

  const medRisk = ["menopause", "diabetes", "thyroid", "autoimmune", "neurologic", "rosacea_psoriasis"];
  for (const c of medRisk) {
    if (data.medicalConditions.includes(c)) count++;
  }

  const ocularRisk = ["dry_eye_disease", "uveitis", "corneal_abrasion_scar", "contact_lens_problem"];
  for (const c of ocularRisk) {
    if (data.ocularConditions.includes(c)) count++;
  }

  if (data.contactLensUse === "yes_over_8hrs" || data.contactLensUse === "sleep_swim") count++;

  for (const t of PRESCRIPTION_RISK_TREATMENTS) {
    if (data.pastFailedTreatments.includes(t)) count++;
  }

  return count;
}

// ── Final severity: max of frequency/intensity, escalated by high risk ──────
const SEVERITY_ORDER: Record<Severity, number> = { mild: 0, moderate: 1, severe: 2 };
const SEVERITY_FROM_ORDER: Severity[] = ["mild", "moderate", "severe"];

export function getFinalSeverity(freqSev: Severity, intSev: Severity, riskTier: RiskTier): Severity {
  const base = SEVERITY_ORDER[freqSev] >= SEVERITY_ORDER[intSev] ? freqSev : intSev;
  if (riskTier === "high") {
    return SEVERITY_FROM_ORDER[Math.min(SEVERITY_ORDER[base] + 1, 2)];
  }
  return base;
}

// ── Prior treatment flag ─────────────────────────────────────────────────────
export function hasPriorTreatment(pastFailed: string[]): boolean {
  return pastFailed.length > 0 && !pastFailed.every((t) => t === "none");
}

// ── Treatment pathways ───────────────────────────────────────────────────────
const PATHWAYS: Record<Severity, { noTreatment: string[]; priorTreatment: string[]; poorResponse: string[] }> = {
  mild: {
    noTreatment: [
      "Artificial tears",
      "Warm compresses",
      "Lid wipes",
      "Humidifier",
      "Omega-3",
    ],
    priorTreatment: [
      "FML",
      "Ciclosporine or Lifitegrast",
      "Doxycycline",
    ],
    poorResponse: [
      "Change type of artificial tears",
      "Add doxycycline",
      "Change type of ciclosporine / lifitegrast",
    ],
  },
  moderate: {
    noTreatment: [
      "Artificial tears",
      "Warm compresses",
      "Lid wipes",
      "Humidifier",
      "Omega-3",
      "Ciclosporine",
    ],
    priorTreatment: [
      "FML",
      "Ciclosporine",
      "Doxycycline",
    ],
    poorResponse: [
      "Change type of artificial tears",
      "Add serum tears / endoret",
      "Change type of ciclosporine / lifitegrast",
    ],
  },
  severe: {
    noTreatment: [
      "Artificial tears",
      "Warm compresses",
      "Lid wipes",
      "Omega-3",
    ],
    priorTreatment: [
      "FML",
      "Ciclosporine or Lifitegrast",
    ],
    poorResponse: [
      "Change type of artificial tears",
      "Add serum tears / endoret",
      "Change type of ciclosporine / lifitegrast",
      "Referral — amniotic membrane",
    ],
  },
};

export function getPathway(severity: Severity, priorTreatment: boolean): TreatmentPathway {
  const p = PATHWAYS[severity];
  return {
    firstLine: priorTreatment ? p.priorTreatment : p.noTreatment,
    poorResponse: p.poorResponse,
  };
}
