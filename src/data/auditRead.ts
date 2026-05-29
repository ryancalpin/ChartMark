/**
 * Admin-only read of the audit trail for the medicolegal viewer. This is NOT a
 * provider-facing surface — it exists for risk-management / compliance review.
 * Reads the in-browser mock log by default, or the FastAPI service when the
 * real audit backend is enabled, normalizing both into a common display shape.
 */

export interface AuditDisplayRow {
  tokenId: string;
  type: string;
  event: string;
  fhirResourceId: string | null;
  fhirResourceVersion: string | null;
  fetchedAt: string | null;
  changed: boolean;
  overridden: boolean;
  actor: string;
  createdAt: string;
}

export interface AuditAckRow {
  tokenId: string;
  flagReason: string;
  actor: string;
  createdAt: string;
}

export interface AuditTrail {
  tokens: AuditDisplayRow[];
  acks: AuditAckRow[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normToken(r: any): AuditDisplayRow {
  return {
    tokenId: r.tokenId ?? r.token_id,
    type: r.type,
    event: r.event,
    fhirResourceId: r.fhirResourceId ?? r.fhir_resource_id ?? null,
    fhirResourceVersion: r.fhirResourceVersion ?? r.fhir_resource_version ?? null,
    fetchedAt: r.fetchedAt ?? r.fetched_at ?? null,
    changed: !!(r.changedBetweenDraftAndSigning ?? r.changed_between_draft_and_signing),
    overridden: !!(r.manuallyOverridden ?? r.manually_overridden),
    actor: r.actor,
    createdAt: r.createdAt ?? r.created_at,
  };
}

function normAck(r: any): AuditAckRow {
  return {
    tokenId: r.tokenId ?? r.token_id,
    flagReason: r.flagReason ?? r.flag_reason,
    actor: r.actor,
    createdAt: r.createdAt ?? r.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function readAuditTrail(noteId: string): Promise<AuditTrail> {
  if (import.meta.env.VITE_USE_REAL_AUDIT === "true") {
    const res = await fetch(`/api/audit/notes/${noteId}`);
    const json = await res.json();
    return {
      tokens: (json.tokens ?? []).map(normToken),
      acks: (json.acks ?? []).map(normAck),
    };
  }

  const raw = localStorage.getItem("chartmark.audit");
  const log = raw ? JSON.parse(raw) : { tokens: [], acks: [] };
  return {
    tokens: (log.tokens ?? []).filter((t: { noteId: string }) => t.noteId === noteId).map(normToken),
    acks: (log.acks ?? []).filter((a: { noteId: string }) => a.noteId === noteId).map(normAck),
  };
}
