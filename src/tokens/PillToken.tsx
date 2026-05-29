/**
 * Single-line pill token: medications, vitals, allergies, dates. Icon + value +
 * optional abnormal arrow, with draft pulse / flash / stale / lock indicators
 * and a hover affordance to open the manual-override editor (while in draft).
 */

import { useRef, useState } from "react";
import type { EditorView } from "prosemirror-view";
import type { TokenAttrs } from "../types/tokens";
import { useTokenDisplay } from "../hooks/useTokenDisplay";
import { tokenIcon } from "./tokenTheme";
import { chipClass, chipStyle } from "./tokenStyles";
import { AbnormalArrow } from "./parts/AbnormalArrow";
import { StaleBadge } from "./parts/StaleBadge";
import { LockIndicator } from "./parts/LockIndicator";
import { OverridePopover } from "./parts/OverridePopover";

interface Props {
  attrs: TokenAttrs;
  view: EditorView;
  getPos: () => number | undefined;
}

export function PillToken({ attrs, view, getPos }: Props) {
  const d = useTokenDisplay(attrs);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const display = d.value?.display ?? attrs.displayLabel ?? "[unavailable]";
  const isVital = attrs.type === "vital";

  return (
    <span
      ref={ref}
      className={chipClass({
        locked: d.locked,
        flash: d.flash,
        stale: d.stale,
        allergy: attrs.type === "allergy",
        conflict: d.conflict,
      })}
      style={chipStyle(d.colors)}
      title={d.conflictMessage ?? (d.overridden ? "Manually overridden" : undefined)}
    >
      {d.conflict && <span aria-label="conflict">⚠</span>}
      <span aria-hidden>{tokenIcon(attrs.type)}</span>
      <span className="font-mono">{display}</span>
      <AbnormalArrow level={d.value?.abnormal} />
      {isVital && d.relative && <span className="opacity-60">({d.relative})</span>}
      {d.overridden && <span title="overridden" aria-label="overridden">✎</span>}
      {d.stale && <StaleBadge observedAt={d.value?.observedAt} relative={d.relative} />}
      {d.locked ? (
        <LockIndicator attrs={attrs} />
      ) : (
        <button
          data-token-interactive
          onClick={() => setEditing(true)}
          className="cm-edit-affordance ml-0.5 opacity-0 transition-opacity hover:opacity-100"
          title="Override value"
        >
          ▾
        </button>
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
