/**
 * The floating @ command palette. Renders when the mention plugin reports an
 * active "@", positioned at the trigger via ProseMirror coords. Handles
 * keyboard nav (↑/↓ select, Enter insert, Tab cycles category, Esc dismiss)
 * through the key-handler ref the editor wired into the mention plugin.
 */

import { useEffect, useMemo, useState } from "react";
import { useFloating, autoUpdate, offset, flip, shift, FloatingPortal } from "@floating-ui/react";
import type { EditorView } from "prosemirror-view";
import type { PaletteCategory, PaletteItem, PaletteVariant } from "../types/palette";
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
  const [disambig, setDisambig] = useState<PaletteItem | null>(null);
  const [variantSel, setVariantSel] = useState(0);
  // Tracks the query the user dismissed with Escape. Must be state, not a ref:
  // setting it has to trigger a re-render so the palette actually closes. (A ref
  // mutation wouldn't, and Escape's setCategory("all") is a no-op when already
  // on "all" — the common case — so it can't be relied on to force the render.)
  const [dismissedQuery, setDismissedQuery] = useState<string | null>(null);

  const active = mention.active && ready && dismissedQuery !== mention.query;

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

  const insertCtx = () => ({
    getValue,
    now,
    admitDate: chart?.patient.admitDate ?? now.toISOString(),
    audit,
    noteId: note.id,
    actor: CURRENT_USER.email,
  });

  const insert = (item: PaletteItem) => {
    const to = view.state.selection.from;
    insertTokens(view, mention.from, to, item, insertCtx(), mention.query || null);
    setDismissedQuery(null);
    setDisambig(null);
  };

  /** Insert a token pinned to a specific historical draw. */
  const insertVariantValue = (item: PaletteItem, variant: PaletteVariant) => {
    const to = view.state.selection.from;
    insertTokens(view, mention.from, to, item, insertCtx(), mention.query || null, variant.value);
    setDismissedQuery(null);
    setDisambig(null);
  };

  const openDisambig = (item: PaletteItem) => {
    if (!item.variants || item.variants.length < 2) return;
    setDisambig(item);
    setVariantSel(0);
  };

  // Reset variant cursor when entering/leaving disambiguation.
  useEffect(() => setVariantSel(0), [disambig]);

  // Wire keyboard handling into the mention plugin while open.
  useEffect(() => {
    if (!active) {
      keyHandlerRef.current = null;
      return;
    }
    keyHandlerRef.current = (e: KeyboardEvent) => {
      // --- Disambiguation sub-list: choose a historical draw ---------------
      if (disambig) {
        const count = (disambig.variants?.length ?? 0) + 1; // +1 for "live"
        if (e.key === "ArrowDown") {
          setVariantSel((s) => Math.min(count - 1, s + 1));
          return true;
        }
        if (e.key === "ArrowUp") {
          setVariantSel((s) => Math.max(0, s - 1));
          return true;
        }
        if (e.key === "Enter") {
          if (variantSel === 0) insert(disambig); // "Most recent (live)"
          else insertVariantValue(disambig, disambig.variants![variantSel - 1]);
          return true;
        }
        if (e.key === "ArrowLeft" || e.key === "Escape") {
          setDisambig(null);
          return true;
        }
        return false;
      }

      // --- Main result list -------------------------------------------------
      if (e.key === "ArrowDown") {
        setSelected((s) => Math.min(results.length - 1, s + 1));
        return true;
      }
      if (e.key === "ArrowUp") {
        setSelected((s) => Math.max(0, s - 1));
        return true;
      }
      if (e.key === "ArrowRight") {
        const item = results[selected];
        if (item?.variants && item.variants.length > 1) {
          openDisambig(item);
          return true;
        }
        return false;
      }
      if (e.key === "Enter") {
        if (results[selected]) insert(results[selected]);
        else if (results.length === 0 && category !== "all") setCategory("all"); // broaden
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
        setDismissedQuery(mention.query);
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
  }, [active, results, selected, mention.query, disambig, variantSel, category]);

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
          {disambig ? (
            <>
              <button
                data-token-interactive
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDisambig(null);
                }}
                className="text-slate-500 hover:text-slate-800"
              >
                ‹ back
              </button>
              <span className="ml-1 font-medium text-slate-600">{disambig.label} — choose draw</span>
            </>
          ) : (
            <>
              <span className="font-mono text-slate-500">@{mention.query}</span>
              <span className="ml-auto">
                Tab: <span className="font-medium text-slate-600 capitalize">{category}</span>
              </span>
            </>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          {disambig ? (
            <DisambiguationList
              item={disambig}
              selected={variantSel}
              onHover={setVariantSel}
              onPickLive={() => insert(disambig)}
              onPickVariant={(v) => insertVariantValue(disambig, v)}
            />
          ) : results.length === 0 ? (
            category !== "all" ? (
              <button
                data-token-interactive
                onMouseDown={(e) => {
                  e.preventDefault();
                  setCategory("all");
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
              >
                <span aria-hidden>🔍</span>
                <span>
                  No matches in <span className="capitalize">{category}</span> — search all chart data →
                </span>
              </button>
            ) : (
              <div className="px-2 py-3 text-sm text-slate-400">No matching chart data.</div>
            )
          ) : (
            results.map((item, i) => (
              <PaletteItemRow
                key={item.id}
                item={item}
                active={i === selected}
                now={now}
                onSelect={() => insert(item)}
                onHover={() => setSelected(i)}
                onDisambiguate={() => openDisambig(item)}
              />
            ))
          )}
        </div>
      </div>
    </FloatingPortal>
  );
}

/** The sub-list shown when disambiguating a same-named item across draws. */
function DisambiguationList({
  item,
  selected,
  onHover,
  onPickLive,
  onPickVariant,
}: {
  item: PaletteItem;
  selected: number;
  onHover: (i: number) => void;
  onPickLive: () => void;
  onPickVariant: (v: PaletteVariant) => void;
}) {
  const variants = item.variants ?? [];
  return (
    <>
      <button
        data-token-interactive
        onMouseEnter={() => onHover(0)}
        onMouseDown={(e) => {
          e.preventDefault();
          onPickLive();
        }}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
          selected === 0 ? "bg-blue-50" : "hover:bg-slate-50"
        }`}
      >
        <span className="w-5 text-center" aria-hidden>
          ◉
        </span>
        <span className="flex-1 font-medium text-slate-800">Most recent (live)</span>
        <span className="text-[10px] uppercase tracking-wide text-blue-400">updates</span>
      </button>
      {variants.map((v, i) => (
        <button
          key={v.id}
          data-token-interactive
          onMouseEnter={() => onHover(i + 1)}
          onMouseDown={(e) => {
            e.preventDefault();
            onPickVariant(v);
          }}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
            selected === i + 1 ? "bg-blue-50" : "hover:bg-slate-50"
          }`}
        >
          <span className="w-5 text-center text-slate-300" aria-hidden>
            ○
          </span>
          <span className="flex-1 font-mono text-xs text-slate-600">{v.valueDisplay}</span>
          <span className="shrink-0 text-[11px] text-slate-400">{v.label}</span>
        </button>
      ))}
    </>
  );
}
