/**
 * Token type taxonomy and the shape of a token's state. A token's full state
 * lives in the ProseMirror node's attrs (the document is the source of truth),
 * which makes undo/redo, copy/paste and serialization carry provenance for free.
 */

export type TokenType =
  | "medication"
  | "lab"
  | "vital"
  | "problem"
  | "imaging"
  | "allergy"
  | "consult"
  | "date";

/** How a token is drawn. Derived from its type. */
export type TokenRenderMode = "pill" | "expandable" | "linked";

export type LockState = "live" | "locked";

/** Severity/direction of an abnormal numeric value, for the inline arrows. */
export type AbnormalLevel = "normal" | "high" | "low" | "critical-high" | "critical-low";

/**
 * A type-specific value payload. Kept as a discriminated-ish bag rather than a
 * strict union so a snapshot can be frozen verbatim into the signed note.
 */
export interface TokenValue {
  /** Human-readable primary display string, e.g. "Furosemide 80mg IV BID". */
  display: string;
  /** Optional numeric value for labs/vitals, used for abnormal/trend logic. */
  numeric?: number;
  unit?: string;
  /** Abnormal classification for arrows; absent = not applicable. */
  abnormal?: AbnormalLevel;
  /** Reference range for labs. */
  referenceRange?: { low?: number; high?: number; unit?: string; text?: string };
  /** Trend points for lab sparklines, oldest → newest. */
  trend?: { t: string; v: number }[];
  /** When the underlying datum was observed/drawn/measured (ISO). For staleness. */
  observedAt?: string;
  /** Order/result status from the source system. */
  status?: "active" | "discontinued" | "amended" | "entered-in-error" | "final";
  /** Free-form detail rendered in expandable blocks / side panels. */
  detail?: string;
  /** For consult / note-to-note links: a one-line hover summary. */
  summary?: string;
  /** For linked tokens: the id of the note/resource this points at. */
  linkedNoteId?: string;
  /** For date tokens: which rolling date this is (resolves live, locks at sign). */
  dateKind?: "today" | "yesterday" | "admitdate" | "hospitalday";
}

/**
 * The attribute bag stored on a `chart_token` ProseMirror node. Everything the
 * token needs to render live, lock at signing, and produce an audit record.
 */
export interface TokenAttrs {
  tokenId: string;
  type: TokenType;
  /** Logical chart entity id (stable across value refreshes). */
  dataSourceId: string | null;
  /** FHIR provenance, captured at first render and refreshed in draft. */
  fhirResourceId: string | null;
  fhirResourceVersion: string | null;
  fetchedAt: string | null;
  /** Value snapshot at first render (and refreshed while live, not in undo). */
  draftValue: TokenValue | null;
  /** Frozen at signing; null while draft. */
  signedValue: TokenValue | null;
  lockState: LockState;
  /** Manual override payload; null unless the provider typed a value. */
  overrideValue: TokenValue | null;
  manuallyOverridden: boolean;
  /** Canonical label for plain-text fallback and search. */
  displayLabel: string;
  /** Which alias the provider typed to summon this token, if any. */
  aliasUsed: string | null;
}
