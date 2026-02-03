export type Severity = "mild" | "moderate" | "severe";

export function getSeverity(
  totalScore: number,
  deq5Score: number,
  deq5Positive: boolean,
  riskFactorCount: number
): Severity {
  // DEWS3-based severity using DEQ-5 clinical thresholds
  // DEQ-5 score ≥6 is diagnostic cutoff for dry eye (per TFOS DEWS II)
  // DEQ-5 max score: 18, Total max score: ~40

  let baseSeverity: Severity;

  // Primary classification based on DEQ-5 (clinically validated)
  if (!deq5Positive || deq5Score < 6) {
    baseSeverity = "mild";
  } else if (deq5Score < 12) {
    baseSeverity = "moderate";
  } else {
    baseSeverity = "severe";
  }

  // Secondary adjustment based on total symptom burden
  // If high total score despite lower DEQ-5, upgrade
  if (baseSeverity === "mild" && totalScore >= 15) {
    baseSeverity = "moderate";
  }
  if (baseSeverity === "moderate" && totalScore >= 28) {
    baseSeverity = "severe";
  }

  // Risk factor upgrade logic
  // 2+ risk factors: mild -> moderate
  // 3+ risk factors: moderate -> severe
  if (baseSeverity === "mild" && riskFactorCount >= 2) {
    return "moderate";
  }
  if (baseSeverity === "moderate" && riskFactorCount >= 3) {
    return "severe";
  }

  return baseSeverity;
}
