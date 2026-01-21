// Scoring thresholds for dry eye assessment
// New maximum score: 36 (12 questions x 3 max per question)
export const SCORING = {
  MAX_SCORE: 36,
  THRESHOLDS: {
    MILD_MAX: 9,      // 0-9: Mild
    MODERATE_MAX: 21, // 10-21: Moderate
    // 22-36: Severe
  },
} as const;

// Provider data - ophthalmologists only
export const PROVIDERS = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    credentials: "MD, FRCSC",
    specialty: "Ophthalmologist",
    subspecialty: "Cornea & External Disease",
    boardCertifications: ["Royal College of Physicians and Surgeons of Canada", "American Board of Ophthalmology"],
    expertise: ["Dry Eye Disease", "Ocular Surface Disorders", "Corneal Conditions"],
    cpsoNumber: "12345",
    location: "Toronto, Ontario",
    phone: "(416) 555-0100",
  },
  {
    id: 2,
    name: "Dr. James Wilson",
    credentials: "MD, FRCSC",
    specialty: "Ophthalmologist",
    subspecialty: "Oculoplastics & Tear Film",
    boardCertifications: ["Royal College of Physicians and Surgeons of Canada"],
    expertise: ["Meibomian Gland Dysfunction", "Blepharitis", "Punctal Procedures"],
    cpsoNumber: "67891",
    location: "Toronto, Ontario",
    phone: "(416) 555-0200",
  },
] as const;

// Messaging constants
export const MESSAGING = {
  PLATFORM_TITLE: "Klara - Board-Certified Ophthalmologist Care for Dry Eyes",
  PLATFORM_DESCRIPTION: "Get relief from dry, irritated eyes. Take our free assessment and receive personalized treatment recommendations from board-certified ophthalmologists in Ontario.",
  PROVIDER_TYPE: "board-certified ophthalmologists",
  PROVIDER_TYPE_SINGULAR: "fellowship-trained ophthalmologist",
  SPECIALIST_TITLE: "Ophthalmologist",
} as const;

// Prescription treatments (for moderate + severe)
export const PRESCRIPTION_TREATMENTS = [
  {
    name: "Cyclosporine (Restasis)",
    description: "Prescription anti-inflammatory drops that help your eyes produce more natural tears. Used twice daily, typically takes 3-6 months to see full benefit.",
    category: "Anti-inflammatory",
  },
  {
    name: "Lifitegrast (Xiidra)",
    description: "Blocks inflammation that contributes to dry eye. May provide faster relief than cyclosporine for some patients.",
    category: "Anti-inflammatory",
  },
  {
    name: "Short-term Corticosteroid Drops",
    description: "May be prescribed for a limited time to quickly reduce inflammation during flare-ups. Not for long-term use.",
    category: "Corticosteroid",
  },
] as const;

// Procedural treatments (for severe only)
export const PROCEDURAL_TREATMENTS = [
  {
    name: "Punctal Plugs",
    description: "Tiny silicone plugs inserted into tear ducts to help tears stay on your eye surface longer. Quick in-office procedure with immediate results.",
    clinicalNote: "Reversible procedure; can be removed if needed",
  },
  {
    name: "LipiFlow Thermal Pulsation",
    description: "Advanced treatment that applies controlled heat and pressure to unblock meibomian glands. Single treatment can provide relief for 9-12 months.",
    clinicalNote: "Particularly effective for evaporative dry eye",
  },
  {
    name: "Intense Pulsed Light (IPL) Therapy",
    description: "Light-based treatment that reduces inflammation and improves meibomian gland function. Typically requires 3-4 sessions.",
    clinicalNote: "Also helps with rosacea-related dry eye",
  },
  {
    name: "Meibomian Gland Expression",
    description: "Manual expression of blocked glands to restore healthy oil flow. Often combined with warm compresses and lid hygiene.",
    clinicalNote: "May need periodic repeat treatments",
  },
] as const;

// MGD Information
export const MGD_INFO = {
  title: "Understanding Meibomian Gland Dysfunction (MGD)",
  description: "Your symptoms suggest possible meibomian gland dysfunction - one of the most common causes of dry eye. These tiny glands in your eyelids produce oils that prevent tears from evaporating too quickly.",
  symptoms: [
    "Morning crusting or sticky eyelids",
    "Film over vision that clears with blinking",
    "Symptoms worse in dry or windy conditions",
    "Eyelid redness or inflammation",
  ],
} as const;

export type Provider = typeof PROVIDERS[number];
export type PrescriptionTreatment = typeof PRESCRIPTION_TREATMENTS[number];
export type ProceduralTreatment = typeof PROCEDURAL_TREATMENTS[number];
