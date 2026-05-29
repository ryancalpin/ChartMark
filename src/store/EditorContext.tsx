/**
 * Shares the live ProseMirror EditorView with surrounding chrome (toolbar,
 * sign flow, print). `version` bumps on every transaction so consumers that
 * care about doc/selection state re-render; the editor DOM itself is managed
 * imperatively by ProseMirror and is unaffected.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { EditorView } from "prosemirror-view";

interface EditorContextValue {
  view: EditorView | null;
  version: number;
  setView: (v: EditorView | null) => void;
  bump: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const viewRef = useRef<EditorView | null>(null);
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const setView = useCallback(
    (v: EditorView | null) => {
      viewRef.current = v;
      bump();
    },
    [bump],
  );

  // New identity each version so context consumers re-render on transactions.
  const value = useMemo<EditorContextValue>(
    () => ({ view: viewRef.current, version, setView, bump }),
    [version, setView, bump],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
