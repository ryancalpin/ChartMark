/**
 * Seeded patient: John Doe, 67M, HFrEF / CKD IV / AFib.
 *
 * Timestamps are computed relative to load time so the staleness, "changed
 * since open", and abnormal-value demos always behave correctly regardless of
 * when the app is opened. Built to fire every pre-sign review trigger:
 *   - a discontinued medication (Lisinopril)
 *   - a stale lab (HbA1c, routine, drawn >72h ago)
 *   - a stale vital (Weight, measured >4h ago)
 *   - abnormal labs (K low, BNP critical-high, Cr high)
 */

import type { Chart } from "../types/chart";

const now = Date.now();
const H = 3_600_000;
const D = 24 * H;

const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

const admitDate = iso(3 * D); // admitted 3 days ago → Hospital Day 4

export const johnDoeChart: Chart = {
  patient: {
    id: "pt-john-doe",
    name: "John Doe",
    age: 67,
    sex: "M",
    mrn: "WFB-0042-1138",
    summary: "HFrEF (EF 30%) · CKD stage IV · AFib · HTN",
    admitDate,
  },

  medications: [
    {
      id: "med-furosemide",
      fhirResourceId: "MedicationRequest/furosemide-1",
      fhirResourceVersion: "3",
      name: "Furosemide",
      dose: "80mg",
      route: "IV",
      frequency: "BID",
      status: "active",
      orderedAt: iso(2 * D),
    },
    {
      id: "med-carvedilol",
      fhirResourceId: "MedicationRequest/carvedilol-1",
      fhirResourceVersion: "1",
      name: "Carvedilol",
      dose: "12.5mg",
      route: "PO",
      frequency: "BID",
      status: "active",
      orderedAt: iso(3 * D),
    },
    {
      id: "med-apixaban",
      fhirResourceId: "MedicationRequest/apixaban-1",
      fhirResourceVersion: "1",
      name: "Apixaban",
      dose: "5mg",
      route: "PO",
      frequency: "BID",
      status: "active",
      orderedAt: iso(3 * D),
    },
    {
      id: "med-spironolactone",
      fhirResourceId: "MedicationRequest/spironolactone-1",
      fhirResourceVersion: "1",
      name: "Spironolactone",
      dose: "25mg",
      route: "PO",
      frequency: "daily",
      status: "active",
      orderedAt: iso(2 * D),
    },
    {
      // Discontinued — fires the "discontinued med" pre-sign trigger.
      id: "med-lisinopril",
      fhirResourceId: "MedicationRequest/lisinopril-1",
      fhirResourceVersion: "2",
      name: "Lisinopril",
      dose: "10mg",
      route: "PO",
      frequency: "daily",
      status: "discontinued",
      orderedAt: iso(3 * D),
    },
  ],

  labs: [
    {
      id: "lab-potassium",
      fhirResourceId: "Observation/k-latest",
      fhirResourceVersion: "5",
      name: "Potassium",
      loinc: "2823-3",
      value: 3.1,
      unit: "mEq/L",
      referenceRange: { low: 3.5, high: 5.1, unit: "mEq/L" },
      abnormal: "low",
      acuity: "acute",
      drawnAt: iso(6 * H),
      trend: [
        { t: iso(3 * D), v: 4.2 },
        { t: iso(2 * D), v: 3.9 },
        { t: iso(1 * D), v: 3.5 },
        { t: iso(12 * H), v: 3.3 },
        { t: iso(6 * H), v: 3.1 },
      ],
    },
    {
      id: "lab-creatinine",
      fhirResourceId: "Observation/cr-latest",
      fhirResourceVersion: "4",
      name: "Creatinine",
      loinc: "2160-0",
      value: 2.8,
      unit: "mg/dL",
      referenceRange: { low: 0.7, high: 1.3, unit: "mg/dL" },
      abnormal: "high",
      acuity: "acute",
      drawnAt: iso(6 * H),
      trend: [
        { t: iso(3 * D), v: 2.4 },
        { t: iso(2 * D), v: 2.6 },
        { t: iso(1 * D), v: 2.7 },
        { t: iso(6 * H), v: 2.8 },
      ],
    },
    {
      id: "lab-bnp",
      fhirResourceId: "Observation/bnp-latest",
      fhirResourceVersion: "2",
      name: "BNP",
      loinc: "30934-4",
      value: 1850,
      unit: "pg/mL",
      referenceRange: { high: 100, unit: "pg/mL" },
      abnormal: "critical-high",
      acuity: "acute",
      drawnAt: iso(6 * H),
      trend: [
        { t: iso(3 * D), v: 2400 },
        { t: iso(2 * D), v: 2100 },
        { t: iso(1 * D), v: 1980 },
        { t: iso(6 * H), v: 1850 },
      ],
    },
    {
      id: "lab-egfr",
      fhirResourceId: "Observation/egfr-latest",
      fhirResourceVersion: "4",
      name: "eGFR",
      loinc: "33914-3",
      value: 22,
      unit: "mL/min/1.73m²",
      referenceRange: { low: 60, unit: "mL/min/1.73m²" },
      abnormal: "low",
      acuity: "acute",
      drawnAt: iso(6 * H),
      trend: [
        { t: iso(3 * D), v: 26 },
        { t: iso(1 * D), v: 24 },
        { t: iso(6 * H), v: 22 },
      ],
    },
    {
      id: "lab-hgb",
      fhirResourceId: "Observation/hgb-latest",
      fhirResourceVersion: "3",
      name: "Hemoglobin",
      loinc: "718-7",
      value: 9.8,
      unit: "g/dL",
      referenceRange: { low: 13.5, high: 17.5, unit: "g/dL" },
      abnormal: "low",
      acuity: "acute",
      drawnAt: iso(6 * H),
      trend: [
        { t: iso(3 * D), v: 10.6 },
        { t: iso(1 * D), v: 10.1 },
        { t: iso(6 * H), v: 9.8 },
      ],
    },
    {
      // Routine lab drawn 4 days ago → stale (>72h). Fires staleness trigger.
      id: "lab-hba1c",
      fhirResourceId: "Observation/hba1c-1",
      fhirResourceVersion: "1",
      name: "HbA1c",
      loinc: "4548-4",
      value: 6.4,
      unit: "%",
      referenceRange: { low: 4.0, high: 5.6, unit: "%" },
      abnormal: "high",
      acuity: "routine",
      drawnAt: iso(4 * D),
      trend: [
        { t: iso(120 * D), v: 6.1 },
        { t: iso(4 * D), v: 6.4 },
      ],
    },
  ],

  vitals: [
    {
      id: "vital-bp",
      fhirResourceId: "Observation/bp-latest",
      fhirResourceVersion: "8",
      type: "BP",
      value: "142/88",
      unit: "mmHg",
      abnormal: "high",
      measuredAt: iso(1 * H),
    },
    {
      id: "vital-hr",
      fhirResourceId: "Observation/hr-latest",
      fhirResourceVersion: "8",
      type: "HR",
      value: "78",
      unit: "bpm",
      abnormal: "normal",
      measuredAt: iso(1 * H),
    },
    {
      id: "vital-spo2",
      fhirResourceId: "Observation/spo2-latest",
      fhirResourceVersion: "8",
      type: "SpO2",
      value: "94",
      unit: "%",
      abnormal: "low",
      measuredAt: iso(1 * H),
    },
    {
      // Measured 6h ago → stale (>4h). Fires staleness trigger.
      id: "vital-weight",
      fhirResourceId: "Observation/weight-latest",
      fhirResourceVersion: "2",
      type: "Weight",
      value: "82",
      unit: "kg",
      abnormal: "normal",
      measuredAt: iso(6 * H),
    },
  ],

  problems: [
    {
      id: "prob-hfref",
      fhirResourceId: "Condition/hfref-1",
      fhirResourceVersion: "2",
      name: "HFrEF, EF 30%",
      icdCode: "I50.22",
      onset: "2019",
      status: "active",
      detail:
        "Heart failure with reduced ejection fraction. Last TTE EF 30%. Volume overloaded on admission; diuresing on IV furosemide.",
    },
    {
      id: "prob-ckd",
      fhirResourceId: "Condition/ckd-1",
      fhirResourceVersion: "3",
      name: "CKD Stage IV",
      icdCode: "N18.4",
      onset: "2021",
      status: "active",
      detail: "Chronic kidney disease stage IV, baseline Cr ~2.4. Nephrology following.",
    },
    {
      id: "prob-afib",
      fhirResourceId: "Condition/afib-1",
      fhirResourceVersion: "1",
      name: "Atrial Fibrillation",
      icdCode: "I48.91",
      onset: "2018",
      status: "active",
      detail: "Paroxysmal AFib, rate-controlled, anticoagulated on apixaban. CHA₂DS₂-VASc 4.",
    },
    {
      id: "prob-htn",
      fhirResourceId: "Condition/htn-1",
      fhirResourceVersion: "1",
      name: "Hypertension",
      icdCode: "I10",
      onset: "2010",
      status: "active",
      detail: "Essential hypertension.",
    },
  ],

  imaging: [
    {
      id: "img-cxr",
      fhirResourceId: "DiagnosticReport/cxr-1",
      fhirResourceVersion: "1",
      modality: "Chest X-ray",
      date: iso(2 * D),
      impression: "Mild pulmonary edema, small bilateral effusions",
      detail:
        "PA and lateral chest radiograph. Cardiomegaly. Mild pulmonary vascular congestion with interstitial edema. Small bilateral pleural effusions. No focal consolidation or pneumothorax.",
    },
    {
      id: "img-echo",
      fhirResourceId: "DiagnosticReport/echo-1",
      fhirResourceVersion: "1",
      modality: "Echocardiogram (TTE)",
      date: iso(2 * D),
      impression: "LVEF 30%, global hypokinesis, moderate MR",
      detail:
        "Transthoracic echocardiogram. LVEF 30% with global hypokinesis. Moderate mitral regurgitation. Dilated left atrium. Estimated RVSP 45 mmHg.",
    },
  ],

  allergies: [
    {
      id: "allergy-pcn",
      fhirResourceId: "AllergyIntolerance/pcn-1",
      fhirResourceVersion: "1",
      allergen: "Penicillin",
      reaction: "Anaphylaxis",
      severity: "severe",
    },
    {
      id: "allergy-sulfa",
      fhirResourceId: "AllergyIntolerance/sulfa-1",
      fhirResourceVersion: "1",
      allergen: "Sulfa",
      reaction: "Rash",
      severity: "mild",
    },
  ],

  consults: [
    {
      id: "consult-nephrology",
      fhirResourceId: "DocumentReference/neph-1",
      fhirResourceVersion: "1",
      service: "Nephrology",
      date: iso(1 * D),
      noteId: "note-neph-001",
      summary: "Cardiorenal syndrome; continue diuresis, avoid nephrotoxins, recheck BMP q12h.",
      detail:
        "Nephrology consult: Acute on chronic kidney injury, likely cardiorenal type 1 in the setting of ADHF. Recommendations: continue IV diuresis with goal net negative 1–1.5L/day, hold ACE-inhibitor given rising creatinine, avoid NSAIDs and contrast, recheck BMP every 12 hours, renally dose all medications.",
    },
    {
      id: "consult-cardiology",
      fhirResourceId: "DocumentReference/cards-1",
      fhirResourceVersion: "1",
      service: "Cardiology",
      date: iso(2 * D),
      noteId: "note-cards-001",
      summary: "ADHF, continue GDMT, uptitrate as tolerated, no acute ischemia.",
      detail:
        "Cardiology consult: Acute decompensated heart failure. Continue guideline-directed medical therapy. Uptitrate beta-blocker and add MRA as renal function and blood pressure tolerate. No evidence of acute coronary syndrome.",
    },
  ],
};
