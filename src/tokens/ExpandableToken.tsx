/**
 * Expandable token: labs, imaging, consult recs. Collapses to a one-line chip
 * (e.g. "K 3.1 ↓") and, on click, opens a floating panel with the full result,
 * reference range, and a trend sparkline. Expansion is React-only state — it
 * never mutates the document, so it survives undo and live updates cleanly.
 */

import { useRef, useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal,
} from "@floating-ui/react";
import type { EditorView } from "prosemirror-view";
import type { TokenAttrs } from "../types/tokens";
import { useTokenDisplay } from "../hooks/useTokenDisplay";
import { tokenIcon } from "./tokenTheme";
import { chipClass, chipStyle } from "./tokenStyles";
import { AbnormalArrow } from "./parts/AbnormalArrow";
import { StaleBadge } from "./parts/StaleBadge";
import { LockIndicator } from "./parts/LockIndicator";
import { Sparkline } from "./parts/Sparkline";
import { ReferenceRange } from "./parts/ReferenceRange";
import { OverridePopover } from "./parts/OverridePopover";

interface Props {
  attrs: TokenAttrs;
  view: EditorView;
  getPos: () => number | undefined;
}

export function ExpandableToken({ attrs, view, getPos }: Props) {
  const d = useTokenDisplay(attrs);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    elements: { reference: ref.current },
  });

  const value = d.value;
  const display = value?.display ?? attrs.displayLabel ?? "[unavailable]";

  return (
    <span ref={ref}>
      <span
        ref={refs.setReference}
        data-token-interactive
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        className={chipClass({ locked: d.locked, flash: d.flash, stale: d.stale })}
        style={chipStyle(d.colors)}
      >
        <span aria-hidden>{tokenIcon(attrs.type)}</span>
        <span className="font-mono">{display}</span>
        <AbnormalArrow level={value?.abnormal} />
        {d.overridden && <span title="overridden">✎</span>}
        {d.stale && <StaleBadge observedAt={value?.observedAt} relative={d.relative} />}
        {d.locked && <LockIndicator attrs={attrs} />}
        <span className="opacity-50">{open ? "▴" : "▾"}</span>
      </span>

      {open && value && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            data-token-interactive
            className="z-40 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
          >
            <div className="flex items-baseline justify-between">
              <div className="font-sans text-sm font-semibold text-slate-800">
                {attrs.displayLabel}
              </div>
              <div className="font-mono text-sm">
                {value.numeric ?? ""} {value.unit ?? ""}
                <AbnormalArrow level={value.abnormal} />
              </div>
            </div>
            <ReferenceRange value={value} />
            {value.detail && <div className="mt-1 text-xs text-slate-600">{value.detail}</div>}
            {value.trend && value.trend.length > 1 && (
              <div className="mt-2">
                <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
                  Trend
                </div>
                <Sparkline points={value.trend} color={d.colors.fg} />
              </div>
            )}
            {value.observedAt && (
              <div className="mt-2 text-[11px] text-slate-400">
                Drawn {new Date(value.observedAt).toLocaleString()} ({d.relative})
              </div>
            )}
            {!d.locked && (
              <button
                data-token-interactive
                onClick={() => {
                  setOpen(false);
                  setEditing(true);
                }}
                className="mt-2 text-xs text-slate-500 hover:text-slate-800"
              >
                Override value…
              </button>
            )}
          </div>
        </FloatingPortal>
      )}

      {editing && (
        <OverridePopover
          attrs={attrs}
          view={view}
          getPos={getPos}
          currentDisplay={display}
          anchor={ref.current}
          onClose={() => setEditing(false)}
        />
      )}
    </span>
  );
}
