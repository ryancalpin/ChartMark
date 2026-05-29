/**
 * Linked token: problems and consults (incl. note-to-note links like
 * @nephrology). Clicking opens the detail side panel; hovering shows a one-line
 * summary card — directly addressing "go read the 8-page consult yourself".
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
import type { TokenAttrs } from "../types/tokens";
import { useTokenDisplay } from "../hooks/useTokenDisplay";
import { useUi } from "../store/UiContext";
import { tokenIcon } from "./tokenTheme";
import { chipClass, chipStyle } from "./tokenStyles";
import { LockIndicator } from "./parts/LockIndicator";

interface Props {
  attrs: TokenAttrs;
}

export function LinkedToken({ attrs }: Props) {
  const d = useTokenDisplay(attrs);
  const { openDetail } = useUi();
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const { refs, floatingStyles } = useFloating({
    open: hover,
    placement: "top-start",
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    elements: { reference: ref.current },
  });

  const value = d.value;
  const display = value?.display ?? attrs.displayLabel ?? "[unavailable]";
  const summary = value?.summary ?? value?.detail;

  return (
    <span ref={ref}>
      <span
        ref={refs.setReference}
        data-token-interactive
        role="button"
        tabIndex={0}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() =>
          attrs.dataSourceId && openDetail({ type: attrs.type, dataSourceId: attrs.dataSourceId })
        }
        className={`${chipClass({ locked: d.locked, flash: d.flash, stale: d.stale, conflict: d.conflict })} underline decoration-dotted underline-offset-2`}
        style={chipStyle(d.colors)}
        title={d.conflictMessage ?? undefined}
      >
        {d.conflict && <span aria-label="conflict">⚠</span>}
        <span aria-hidden>{tokenIcon(attrs.type)}</span>
        <span>{display}</span>
        {d.overridden && <span title="overridden">✎</span>}
        {d.locked && <LockIndicator attrs={attrs} />}
      </span>

      {hover && summary && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-40 max-w-xs rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 shadow-xl"
          >
            <div className="mb-0.5 font-semibold text-slate-800">{attrs.displayLabel}</div>
            {summary}
            <div className="mt-1 text-[11px] text-slate-400">Click to open detail panel →</div>
          </div>
        </FloatingPortal>
      )}
    </span>
  );
}
