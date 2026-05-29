/**
 * The floating @ command palette. Renders when the mention plugin reports an
 * active "@", positioned at the trigger via ProseMirror coords. Handles
 * keyboard nav (↑/↓ select, Enter insert, Tab cycles category, Esc dismiss)
 * through the key-handler ref the editor wired into the mention plugin.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFloating, autoUpdate, offset, flip, shift, FloatingPortal } from "@floating-ui/react";
import type { EditorView } from "prosemirror-view";
import type { PaletteCategory, PaletteItem } from "../types/palette";
import type { MentionKeyHandlerRef, MentionState } from "../editor/plugins/mentionTrigger";
import { usePaletteSearch } from "./usePaletteSearch";
import { PaletteItemRow } from "./PaletteItemRow";
import { insertTokens } from "../editor/commands/insertToken";
import { useChart } from "../store/ChartContext";
import { useUi } from "../store/UiContext";
import { useAudit } from "../store/AuditContext";
import { useNote } from "../store/NoteContext";
import { CURRENT_USER } from "../lib/user";

const CATEGORIES: PaletteCategory[] = [
  "all",
  "medication",
  "lab",
  "vital",
  "problem",
  "imaging",
  "allergy",
  "consult",
  "date",
];

interface Props {
  view: EditorView;
  mention: MentionState;
  keyHandlerRef: MentionKeyHandlerRef;
}

export function CommandPalette({ view, mention, keyHandlerRef }: Props) {
  const { search, ready } = usePaletteSearch();
  const { getValue, chart } = useChart();
  const { now } = useUi();
  const { service: audit } = useAudit();
  const { note } = useNote();

  const [selected, setSelected] = useState(0);
  const [category, setCategory] = useState<PaletteCategory>("all");
  const dismissedQuery = useRef<string | null>(null);

  const active = mention.active && ready && dismissedQuery.current !== mention.query;

  const results = useMemo(
    () => (active ? search(mention.query, category) : []),
    [active, search, mention.query, category],
  );

  // Reset selection as the query or category changes.
  useEffect(() => setSelected(0), [mention.query, category]);

  // Position a virtual reference at the "@" trigger.
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (!active || mention.from < 0) return;
    refs.setPositionReference({
      getBoundingClientRect() {
        const c = view.coordsAtPos(mention.from);
        return {
          x: c.left,
          y: c.top,
          top: c.top,
          left: c.left,
          right: c.left,
          bottom: c.bottom,
          width: 0,
          height: c.bottom - c.top,
        };
      },
    });
  }, [active, mention.from, mention.query, refs, view]);

  const insert = (item: PaletteItem) => {
    const to = view.state.selection.from;
    insertTokens(view, mention.from, to, item, {
      getValue,
      now,
      admitDate: chart?.patient.admitDate ?? now.toISOString(),
      audit,
      noteId: note.id,
      actor: CURRENT_USER.email,
    }, mention.query || null);
    dismissedQuery.current = null;
  };

  // Wire keyboard handling into the mention plugin while open.
  useEffect(() => {
    if (!active) {
      keyHandlerRef.current = null;
      return;
    }
    keyHandlerRef.current = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        setSelected((s) => Math.min(results.length - 1, s + 1));
        return true;
      }
      if (e.key === "ArrowUp") {
        setSelected((s) => Math.max(0, s - 1));
        return true;
      }
      if (e.key === "Enter") {
        if (results[selected]) insert(results[selected]);
        return true;
      }
      if (e.key === "Tab") {
        setCategory((c) => {
          const idx = CATEGORIES.indexOf(c);
          return CATEGORIES[(idx + (e.shiftKey ? -1 + CATEGORIES.length : 1)) % CATEGORIES.length];
        });
        return true;
      }
      if (e.key === "Escape") {
        dismissedQuery.current = mention.query;
        keyHandlerRef.current = null;
        setCategory("all");
        return true;
      }
      return false;
    };
    return () => {
      keyHandlerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, results, selected, mention.query]);

  if (!active) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        data-token-interactive
        className="z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center gap-1 border-b border-slate-100 px-2 py-1.5 text-[11px] text-slate-400">
          <span className="font-mono text-slate-500">@{mention.query}</span>
          <span className="ml-auto">
            Tab: <span className="font-medium text-slate-600 capitalize">{category}</span>
          </span>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {results.length === 0 ? (
            <div className="px-2 py-3 text-sm text-slate-400">
              No matches. Try a different term or Tab to broaden category.
            </div>
          ) : (
            results.map((item, i) => (
              <PaletteItemRow
                key={item.id}
                item={item}
                active={i === selected}
                now={now}
                onSelect={() => insert(item)}
                onHover={() => setSelected(i)}
              />
            ))
          )}
        </div>
      </div>
    </FloatingPortal>
  );
}
