/**
 * Note metadata + lifecycle. The note body lives in the ProseMirror document;
 * this holds status (draft → pending_cosign → signed), signer identities,
 * timestamps, and addenda. Updated by the sign / co-sign / addendum flows.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Addendum, NoteMeta } from "../types/note";
import { newId } from "../lib/id";

interface NoteContextValue {
  note: NoteMeta;
  setTitle: (title: string, type: string) => void;
  /** Preliminary (resident) signature in a co-sign workflow. */
  submitForCosign: (by: string) => void;
  /** Finalizing signature — freezes tokens. */
  sign: (signedBy: string) => void;
  addAddendum: (author: string, reason: string) => Addendum;
}

const NoteContext = createContext<NoteContextValue | null>(null);

export function useNote(): NoteContextValue {
  const ctx = useContext(NoteContext);
  if (!ctx) throw new Error("useNote must be used within NoteProvider");
  return ctx;
}

function initialNote(): NoteMeta {
  const now = new Date().toISOString();
  return {
    id: newId("note"),
    patientId: "pt-john-doe",
    title: "Progress Note",
    type: "Progress Note",
    status: "draft",
    createdAt: now,
    openedAt: now,
    submittedBy: null,
    submittedAt: null,
    signedAt: null,
    signedBy: null,
    addenda: [],
  };
}

export function NoteProvider({ children }: { children: ReactNode }) {
  const [note, setNote] = useState<NoteMeta>(initialNote);

  const value = useMemo<NoteContextValue>(
    () => ({
      note,
      setTitle: (title, type) => setNote((n) => ({ ...n, title, type })),
      submitForCosign: (by) =>
        setNote((n) => ({
          ...n,
          status: "pending_cosign",
          submittedBy: by,
          submittedAt: new Date().toISOString(),
        })),
      sign: (signedBy) =>
        setNote((n) => ({
          ...n,
          status: "signed",
          signedAt: new Date().toISOString(),
          signedBy,
        })),
      addAddendum: (author, reason) => {
        const addendum: Addendum = {
          id: newId("add"),
          author,
          reason,
          createdAt: new Date().toISOString(),
        };
        setNote((n) => ({ ...n, addenda: [...n.addenda, addendum] }));
        return addendum;
      },
    }),
    [note],
  );

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
}
