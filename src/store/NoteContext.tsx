/**
 * Note metadata + status. The note body lives in the ProseMirror document; this
 * holds the surrounding lifecycle state (draft/signed, signer, timestamps) and
 * is updated by the sign command.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { NoteMeta } from "../types/note";
import { newId } from "../lib/id";

interface NoteContextValue {
  note: NoteMeta;
  sign: (signedBy: string) => void;
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
    signedAt: null,
    signedBy: null,
  };
}

export function NoteProvider({ children }: { children: ReactNode }) {
  const [note, setNote] = useState<NoteMeta>(initialNote);

  const value = useMemo<NoteContextValue>(
    () => ({
      note,
      sign: (signedBy: string) =>
        setNote((n) => ({
          ...n,
          status: "signed",
          signedAt: new Date().toISOString(),
          signedBy,
        })),
    }),
    [note],
  );

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
}
