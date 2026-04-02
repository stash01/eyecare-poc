export const OCULAR_CONDITIONS = [
  { value: "none", label: "No known ocular diseases" },
  { value: "dry_eye_disease", label: "Dry eye disease" },
  { value: "glaucoma", label: "Glaucoma" },
  { value: "cataract", label: "Cataract" },
  { value: "macular_degeneration", label: "Macular degeneration" },
  { value: "diabetic_retinopathy", label: "Diabetic retinopathy" },
  { value: "corneal_abrasion_scar", label: "Corneal abrasion / scar" },
  { value: "conjunctivitis", label: "Conjunctivitis (pink eye)" },
  { value: "uveitis", label: "Uveitis" },
  { value: "contact_lens_problem", label: "Contact lens-related problem" },
  { value: "eye_surgery", label: "Eye surgery (please specify below)" },
  { value: "other_ocular", label: "Other (please specify below)" },
];

export const CONTACT_LENS_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "previously", label: "Previously but not anymore" },
  { value: "yes_under_8hrs", label: "Yes, <8 hrs/day" },
  { value: "yes_over_8hrs", label: "Yes, >8 hrs/day" },
  { value: "sleep_swim", label: "I occasionally sleep/swim in them" },
  { value: "other_lens", label: "Other" },
];

export const MEDICAL_CONDITIONS = [
  { value: "none", label: "No known conditions" },
  { value: "menopause", label: "Menopause" },
  { value: "diabetes", label: "Diabetes" },
  { value: "thyroid", label: "Thyroid disease" },
  { value: "autoimmune", label: "Autoimmune disease (Sjogren's, Lupus, etc.)" },
  { value: "neurologic", label: "Neurologic disorder (Parkinson's, Multiple Sclerosis)" },
  { value: "rosacea_psoriasis", label: "Rosacea / Psoriasis" },
  { value: "other_medical", label: "Other (please specify below)" },
];

export const SYMPTOMS = [
  { key: "dryness", label: "Dryness" },
  { key: "soreness", label: "Soreness / Discomfort" },
  { key: "grittiness", label: "Irritation / Grittiness" },
  { key: "burning", label: "Burning / Stinging" },
  { key: "watering", label: "Watering / Excess tearing" },
  { key: "blurred", label: "Blurred / Fluctuating vision" },
] as const;

export type SymptomKey = typeof SYMPTOMS[number]["key"];

export const FREQUENCY_OPTIONS = [
  { label: "Never", value: 0 },
  { label: "Occasionally", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Often", value: 3 },
  { label: "Constantly", value: 4 },
];

export const TREATMENT_OPTIONS = [
  { value: "artificial_tears", label: "Artificial tears / lubricating drops" },
  { value: "restasis", label: "Restasis" },
  { value: "xiidra", label: "Xiidra" },
  { value: "cequa", label: "Cequa" },
  { value: "serum_tears", label: "Serum Tears" },
  { value: "insulin_drops", label: "Insulin eye drops" },
  { value: "steroid_drops", label: "Steroid eye drops (specify name below)" },
  { value: "punctal_plugs", label: "Punctal plugs" },
  { value: "warm_compresses", label: "Warm compresses / lid hygiene" },
  { value: "omega3", label: "Omega-3 / oral supplements" },
  { value: "environmental", label: "Environmental changes (humidifier, screen breaks)" },
  { value: "amniotic", label: "Amniotic membrane" },
  { value: "lipiflow", label: "Lipiflow" },
  { value: "ipl_rf", label: "Intense Pulsed Light / Radiofrequency Laser" },
  { value: "none", label: "None" },
  { value: "other_treatment", label: "Other (please specify below)" },
];
