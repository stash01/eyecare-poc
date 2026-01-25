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
  PLATFORM_TITLE: "KlaraMD - Board-Certified Ophthalmologist Care for Dry Eyes",
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

// Store Products
export interface Product {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  compareAtPrice?: number;
  category: ProductCategory;
  image: string;
  badge?: string;
  inStock: boolean;
  features: string[];
  usage: string;
}

export type ProductCategory =
  | "artificial-tears"
  | "warm-compresses"
  | "lid-care"
  | "supplements"
  | "accessories";

export const PRODUCT_CATEGORIES: Record<ProductCategory, { name: string; description: string }> = {
  "artificial-tears": {
    name: "Artificial Tears",
    description: "Lubricating eye drops for immediate relief",
  },
  "warm-compresses": {
    name: "Warm Compresses",
    description: "Heat therapy for meibomian gland function",
  },
  "lid-care": {
    name: "Lid Care",
    description: "Cleansers and wipes for eyelid hygiene",
  },
  "supplements": {
    name: "Supplements",
    description: "Omega-3s and vitamins for eye health",
  },
  "accessories": {
    name: "Accessories",
    description: "Humidifiers, glasses, and more",
  },
};

export const PRODUCTS: Product[] = [
  // Artificial Tears
  {
    id: "systane-ultra-pf",
    name: "Systane Ultra Preservative-Free",
    description: "Premium preservative-free lubricating drops for sensitive eyes",
    longDescription: "Systane Ultra Preservative-Free eye drops provide extended protection and high-performance dry eye symptom relief. The preservative-free formula is gentle enough for sensitive eyes and safe for frequent use.",
    price: 24.99,
    compareAtPrice: 29.99,
    category: "artificial-tears",
    image: "/products/systane-ultra.jpg",
    badge: "Best Seller",
    inStock: true,
    features: [
      "Preservative-free formula",
      "Extended protection technology",
      "Safe for contact lens wearers",
      "30 single-use vials",
    ],
    usage: "Instill 1-2 drops in affected eye(s) as needed.",
  },
  {
    id: "refresh-optive-mega3",
    name: "Refresh Optive Mega-3",
    description: "Lipid-enhanced formula for evaporative dry eye",
    longDescription: "Refresh Optive Mega-3 contains flaxseed oil to help restore the lipid layer of tears, reducing tear evaporation. Ideal for those with meibomian gland dysfunction.",
    price: 22.99,
    category: "artificial-tears",
    image: "/products/refresh-optive.jpg",
    inStock: true,
    features: [
      "Contains flaxseed oil",
      "Restores lipid layer",
      "Reduces tear evaporation",
      "Preservative-free available",
    ],
    usage: "Instill 1-2 drops in affected eye(s) as needed throughout the day.",
  },
  {
    id: "theratears-dry-eye",
    name: "TheraTears Dry Eye Therapy",
    description: "Electrolyte-balanced formula that mimics natural tears",
    longDescription: "TheraTears uses a unique hypotonic and electrolyte-balanced formula that replicates healthy tears. Clinically proven to improve the health of the eye surface.",
    price: 18.99,
    category: "artificial-tears",
    image: "/products/theratears.jpg",
    inStock: true,
    features: [
      "Electrolyte balanced",
      "Hypotonic formula",
      "Restores natural tear balance",
      "Clinically proven",
    ],
    usage: "Use 1-2 drops as needed or as directed by your eye care professional.",
  },
  {
    id: "genteal-gel-nighttime",
    name: "GenTeal Gel Severe Dry Eye",
    description: "Thick gel formula for overnight protection",
    longDescription: "GenTeal Gel provides long-lasting overnight relief for severe dry eye symptoms. The thick gel formula stays on the eye surface longer, protecting and hydrating while you sleep.",
    price: 16.99,
    category: "artificial-tears",
    image: "/products/genteal-gel.jpg",
    inStock: true,
    features: [
      "Long-lasting gel formula",
      "Ideal for nighttime use",
      "Severe dry eye relief",
      "Preservative-free option",
    ],
    usage: "Apply 1-2 drops to affected eye(s) before bedtime or as needed.",
  },
  // Warm Compresses
  {
    id: "bruder-mask",
    name: "Bruder Moist Heat Eye Compress",
    description: "Microwave-activated compress for MGD treatment",
    longDescription: "The Bruder Moist Heat Eye Compress is clinically proven to help treat meibomian gland dysfunction. Simply microwave and apply for soothing, therapeutic moist heat that helps unblock oil glands.",
    price: 29.99,
    compareAtPrice: 34.99,
    category: "warm-compresses",
    image: "/products/bruder-mask.jpg",
    badge: "Recommended",
    inStock: true,
    features: [
      "Clinically proven for MGD",
      "Reusable - lasts 6+ months",
      "Microwave activated",
      "Self-hydrating beads",
    ],
    usage: "Microwave for 20-25 seconds. Apply to closed eyes for 10 minutes, 1-2 times daily.",
  },
  {
    id: "thermalon-compress",
    name: "Thermalon Dry Eye Compress",
    description: "Dual-action hot/cold therapy mask",
    longDescription: "Thermalon compress can be used warm or cold. Warm therapy helps with MGD and blepharitis, while cold therapy soothes irritation and reduces puffiness.",
    price: 24.99,
    category: "warm-compresses",
    image: "/products/thermalon.jpg",
    inStock: true,
    features: [
      "Hot or cold therapy",
      "Contoured eye design",
      "Reusable",
      "Adjustable strap",
    ],
    usage: "Heat in microwave or cool in freezer. Apply for 10-15 minutes.",
  },
  // Lid Care
  {
    id: "ocusoft-lid-scrub",
    name: "OCuSOFT Lid Scrub Plus",
    description: "Pre-moistened pads for daily eyelid hygiene",
    longDescription: "OCuSOFT Lid Scrub Plus effectively removes oil, debris, and desquamated skin from the eyelids. The extra-strength formula is ideal for moderate to severe conditions.",
    price: 21.99,
    category: "lid-care",
    image: "/products/ocusoft.jpg",
    badge: "Doctor Recommended",
    inStock: true,
    features: [
      "Pre-moistened pads",
      "Extra strength formula",
      "Removes oil and debris",
      "30 individually wrapped pads",
    ],
    usage: "Gently scrub along lash line and eyelid margin once or twice daily.",
  },
  {
    id: "systane-lid-wipes",
    name: "Systane Lid Wipes",
    description: "Gentle, hypoallergenic eyelid cleansing wipes",
    longDescription: "Systane Lid Wipes gently clean eyelids and remove debris that can cause irritation. Hypoallergenic and suitable for daily use.",
    price: 14.99,
    category: "lid-care",
    image: "/products/systane-wipes.jpg",
    inStock: true,
    features: [
      "Hypoallergenic",
      "Pre-moistened",
      "Gentle daily cleansing",
      "30 wipes per box",
    ],
    usage: "Gently wipe closed eyelid and lash area. Use morning and night.",
  },
  {
    id: "avenova-spray",
    name: "Avenova Eyelid & Lash Cleanser",
    description: "Pure hypochlorous acid spray for lid hygiene",
    longDescription: "Avenova contains pure hypochlorous acid (HOCl), the same substance your body produces to fight infection. Removes debris and microorganisms without irritation.",
    price: 29.99,
    category: "lid-care",
    image: "/products/avenova.jpg",
    inStock: true,
    features: [
      "Pure hypochlorous acid",
      "Antimicrobial",
      "No rinse required",
      "Gentle and effective",
    ],
    usage: "Spray directly on closed eyelids twice daily or as directed.",
  },
  // Supplements
  {
    id: "prn-omega-3",
    name: "PRN Omega-3 Fish Oil",
    description: "Pharmaceutical-grade omega-3 for dry eye support",
    longDescription: "PRN Omega-3 is specifically formulated for dry eye patients. The re-esterified triglyceride form provides superior absorption compared to standard fish oil.",
    price: 49.99,
    compareAtPrice: 59.99,
    category: "supplements",
    image: "/products/prn-omega.jpg",
    badge: "Clinical Strength",
    inStock: true,
    features: [
      "2240mg EPA/DHA per serving",
      "Re-esterified triglyceride form",
      "90-day supply",
      "Tested for purity",
    ],
    usage: "Take 2 softgels twice daily with meals.",
  },
  {
    id: "nordic-naturals-omega",
    name: "Nordic Naturals ProOmega",
    description: "High-concentrate omega-3 fish oil",
    longDescription: "Nordic Naturals ProOmega delivers high concentrations of EPA and DHA in triglyceride form for optimal absorption. Third-party tested for purity.",
    price: 44.99,
    category: "supplements",
    image: "/products/nordic-omega.jpg",
    inStock: true,
    features: [
      "1280mg omega-3 per serving",
      "Triglyceride form",
      "Lemon flavored",
      "Sustainably sourced",
    ],
    usage: "Take 2 softgels daily with food.",
  },
  {
    id: "hydro-eye-vitamins",
    name: "HydroEye Dry Eye Formula",
    description: "Complete nutritional support for dry eyes",
    longDescription: "HydroEye is a patented oral supplement that provides GLA, EPA, DHA, and other nutrients clinically shown to support healthy tear production.",
    price: 39.99,
    category: "supplements",
    image: "/products/hydroeye.jpg",
    inStock: true,
    features: [
      "Patented formula",
      "GLA + EPA + DHA",
      "Vitamin A & D included",
      "60-day supply",
    ],
    usage: "Take 2 softgels twice daily with meals.",
  },
  // Accessories
  {
    id: "portable-humidifier",
    name: "Portable USB Humidifier",
    description: "Desktop humidifier for office or home",
    longDescription: "This compact USB-powered humidifier adds moisture to your immediate environment, helping to reduce dry eye symptoms caused by dry indoor air.",
    price: 34.99,
    category: "accessories",
    image: "/products/humidifier.jpg",
    inStock: true,
    features: [
      "USB powered",
      "Whisper quiet",
      "Auto shut-off",
      "300ml capacity",
    ],
    usage: "Fill with water and connect to USB port. Run during work hours.",
  },
  {
    id: "moisture-glasses",
    name: "Ziena Moisture Chamber Glasses",
    description: "Eyewear that creates a humid microclimate",
    longDescription: "Ziena glasses feature a soft silicone eye cup that creates a moisture chamber around your eyes, reducing tear evaporation and protecting from wind and drafts.",
    price: 79.99,
    compareAtPrice: 99.99,
    category: "accessories",
    image: "/products/ziena-glasses.jpg",
    badge: "Premium",
    inStock: true,
    features: [
      "Moisture chamber technology",
      "Removable silicone eye cup",
      "Multiple frame styles",
      "Prescription-ready",
    ],
    usage: "Wear during activities that trigger dry eye symptoms.",
  },
  {
    id: "sleep-mask-silk",
    name: "Silk Sleep Mask",
    description: "Gentle sleep mask to protect eyes overnight",
    longDescription: "This 100% mulberry silk sleep mask is gentle on the delicate eye area and helps prevent nocturnal lagophthalmos (incomplete eye closure during sleep).",
    price: 19.99,
    category: "accessories",
    image: "/products/sleep-mask.jpg",
    inStock: true,
    features: [
      "100% mulberry silk",
      "Adjustable strap",
      "Breathable design",
      "Hypoallergenic",
    ],
    usage: "Wear during sleep to protect eyes and block light.",
  },
];
