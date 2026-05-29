/** Note metadata. The note body lives as a ProseMirror JSON document. */

export type NoteStatus = "draft" | "pending_cosign" | "signed";

export interface Addendum {
  id: string;
  author: string;
  createdAt: string;
  reason: string;
}

export interface NoteMeta {
  id: string;
  patientId: string;
  title: string;
  type: string; // "Progress Note", "HF Admission Note", ...
  status: NoteStatus;
  createdAt: string;
  openedAt: string; // when this editing session opened — basis for "changed since open"
  /** Preliminary signature (resident) in a co-sign workflow. */
  submittedBy: string | null;
  submittedAt: string | null;
  /** Finalizing signature — the one that freezes tokens. */
  signedAt: string | null;
  signedBy: string | null;
  /** Formal addenda added after signing (CMS/Joint Commission requirement). */
  addenda: Addendum[];
}

/** A persisted note = metadata plus the serialized ProseMirror doc. */
export interface Note extends NoteMeta {
  /** ProseMirror document JSON. */
  content: unknown;
}
