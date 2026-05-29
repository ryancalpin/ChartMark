/** Note metadata. The note body lives as a ProseMirror JSON document. */

export type NoteStatus = "draft" | "signed";

export interface NoteMeta {
  id: string;
  patientId: string;
  title: string;
  type: string; // "Progress Note", "HF Admission Note", ...
  status: NoteStatus;
  createdAt: string;
  openedAt: string; // when this editing session opened — basis for "changed since open"
  signedAt: string | null;
  signedBy: string | null;
}

/** A persisted note = metadata plus the serialized ProseMirror doc. */
export interface Note extends NoteMeta {
  /** ProseMirror document JSON. */
  content: unknown;
}
