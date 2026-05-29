/**
 * Clinical alias table. Maps the shorthand a provider actually types to the
 * canonical chart entity. Brand names, abbreviations, and lab macros.
 *
 *   @lasix → Furosemide      @k → Potassium       @cr → Creatinine
 *   @bmp   → expands to Na/K/Cl/CO2/BUN/Cr/Glucose (a multi-token macro)
 */

/** Per-entity alias lists, keyed by dataSourceId. */
export const ENTITY_ALIASES: Record<string, string[]> = {
  "med-furosemide": ["lasix", "furosemide", "diuretic"],
  "med-carvedilol": ["coreg", "carvedilol", "beta blocker", "bb"],
  "med-apixaban": ["eliquis", "apixaban", "doac", "anticoagulant"],
  "med-spironolactone": ["aldactone", "spironolactone", "mra"],
  "med-lisinopril": ["zestril", "prinivil", "lisinopril", "acei"],

  "lab-potassium": ["k", "k+", "potassium"],
  "lab-creatinine": ["cr", "creatinine", "scr"],
  "lab-bnp": ["bnp", "natriuretic peptide"],
  "lab-egfr": ["egfr", "gfr"],
  "lab-hgb": ["hgb", "hb", "hemoglobin", "h&h"],
  "lab-hba1c": ["a1c", "hba1c", "glycated hemoglobin"],

  "vital-bp": ["bp", "blood pressure"],
  "vital-hr": ["hr", "heart rate", "pulse"],
  "vital-spo2": ["spo2", "o2 sat", "sat", "pulse ox"],
  "vital-weight": ["wt", "weight"],

  "prob-hfref": ["hf", "hfref", "heart failure", "chf"],
  "prob-ckd": ["ckd", "kidney disease", "renal"],
  "prob-afib": ["afib", "atrial fibrillation", "af"],
  "prob-htn": ["htn", "hypertension", "high blood pressure"],

  "consult-nephrology": ["nephrology", "neph", "renal consult", "kidney"],
  "consult-cardiology": ["cardiology", "cards", "heart consult"],

  "allergy-pcn": ["pcn", "penicillin"],
  "allergy-sulfa": ["sulfa", "sulfonamide"],
};

/**
 * Lab "panel" macros. Selecting the macro inserts one token per member that is
 * present in the chart. (Members not in the seeded chart are skipped.)
 */
export const PANEL_MACROS: Record<string, { label: string; members: string[] }> = {
  bmp: {
    label: "BMP — Basic Metabolic Panel",
    members: ["lab-potassium", "lab-creatinine", "lab-egfr"],
  },
};
