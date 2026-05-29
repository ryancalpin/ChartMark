/**
 * Mappers from FHIR-shaped chart entities to the type-agnostic TokenValue the
 * editor renders. Kept separate from any transport so a future Epic service can
 * reuse them after normalizing Epic's FHIR R4 quirks into our domain types.
 */

import type {
  Allergy,
  Consult,
  ImagingStudy,
  LabResult,
  Medication,
  Problem,
  Vital,
} from "../types/chart";
import type { TokenValue } from "../types/tokens";

export function medToValue(m: Medication): TokenValue {
  return {
    display: `${m.name} ${m.dose} ${m.route} ${m.frequency}`,
    status: m.status,
    observedAt: m.orderedAt,
    detail: `Ordered ${new Date(m.orderedAt).toLocaleString()} · ${m.status}`,
  };
}

export function labToValue(l: LabResult): TokenValue {
  return {
    display: `${l.name} ${l.value} ${l.unit}`,
    numeric: l.value,
    unit: l.unit,
    abnormal: l.abnormal,
    referenceRange: l.referenceRange,
    trend: l.trend,
    observedAt: l.drawnAt,
    status: "final",
    detail: l.referenceRange.text,
  };
}

export function vitalToValue(v: Vital): TokenValue {
  return {
    display: `${v.type} ${v.value}`,
    unit: v.unit,
    abnormal: v.abnormal,
    observedAt: v.measuredAt,
  };
}

export function problemToValue(p: Problem): TokenValue {
  return {
    display: p.name,
    status: p.status === "active" ? "active" : "final",
    detail: p.detail,
    observedAt: p.onset,
  };
}

export function imagingToValue(i: ImagingStudy): TokenValue {
  return {
    display: `${i.modality} — ${i.impression}`,
    detail: i.detail,
    summary: i.impression,
    observedAt: i.date,
  };
}

export function allergyToValue(a: Allergy): TokenValue {
  return {
    display: `${a.allergen} → ${a.reaction}`,
    detail: `Severity: ${a.severity}`,
    status: "active",
  };
}

export function consultToValue(c: Consult): TokenValue {
  return {
    display: `${c.service} consult`,
    summary: c.summary,
    detail: c.detail,
    observedAt: c.date,
    linkedNoteId: c.noteId,
  };
}
