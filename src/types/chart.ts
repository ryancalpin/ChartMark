/**
 * Domain (FHIR-R4-shaped) chart types. The mock data layer maps the seeded
 * fixture into these; a future EpicChartDataService maps Epic FHIR responses
 * into the same shapes so the rest of the app is transport-agnostic.
 */

import type { AbnormalLevel } from "./tokens";

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: "M" | "F";
  mrn: string;
  /** One-line problem summary, e.g. "HFrEF / CKD IV / AFib". */
  summary: string;
  admitDate: string; // ISO
}

export interface Medication {
  id: string;
  fhirResourceId: string;
  fhirResourceVersion: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  status: "active" | "discontinued";
  orderedAt: string;
}

export interface LabResult {
  id: string;
  fhirResourceId: string;
  fhirResourceVersion: string;
  name: string;
  loinc?: string;
  value: number;
  unit: string;
  referenceRange: { low?: number; high?: number; unit?: string; text?: string };
  abnormal: AbnormalLevel;
  /** Acute labs go stale at 24h, routine at 72h. */
  acuity: "acute" | "routine";
  drawnAt: string;
  trend: { t: string; v: number }[];
}

export interface Vital {
  id: string;
  fhirResourceId: string;
  fhirResourceVersion: string;
  type: string; // "BP", "HR", "SpO2", "Temp", "Weight"
  value: string; // "142/88", "78", "94"
  unit: string;
  abnormal: AbnormalLevel;
  measuredAt: string;
}

export interface Problem {
  id: string;
  fhirResourceId: string;
  fhirResourceVersion: string;
  name: string;
  icdCode: string;
  onset: string;
  status: "active" | "resolved";
  detail: string;
}

export interface ImagingStudy {
  id: string;
  fhirResourceId: string;
  fhirResourceVersion: string;
  modality: string;
  date: string;
  impression: string;
  detail: string;
}

export interface Allergy {
  id: string;
  fhirResourceId: string;
  fhirResourceVersion: string;
  allergen: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe";
}

export interface Consult {
  id: string;
  fhirResourceId: string;
  fhirResourceVersion: string;
  service: string;
  date: string;
  noteId: string;
  summary: string;
  detail: string;
}

export interface Chart {
  patient: Patient;
  medications: Medication[];
  labs: LabResult[];
  vitals: Vital[];
  problems: Problem[];
  imaging: ImagingStudy[];
  allergies: Allergy[];
  consults: Consult[];
}
