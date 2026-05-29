/**
 * Inline manual-override editor. Lets the provider type a replacement value for
 * a token; the override is flagged on the node + audit trail but always allowed.
 */

import { useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal,
} from "@floating-ui/react";
import type { EditorView } from "prosemirror-view";
import type { TokenAttrs } from "../../types/tokens";
import { clearOverrideAt, overrideTokenAt } from "../../editor/commands/overrideToken";
import { useAudit, buildTokenAuditRecord } from "../../store/AuditContext";
import { useNote } from "../../store/NoteContext";
import { CURRENT_USER } from "../../lib/user";

interface Props {
  attrs: TokenAttrs;
  view: EditorView;
  getPos: () => number | undefined;
  currentDisplay: string;
  onClose: () => void;
  anchor: HTMLElement | null;
}

export function OverridePopover({ attrs, view, getPos, currentDisplay, onClose, anchor }: Props) {
  const [text, setText] = useState(currentDisplay);
  const { service: audit } = useAudit();
  const { note } = useNote();

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    elements: { reference: anchor ?? undefined },
  });

  const save = () => {
    const pos = getPos();
    if (pos == null) return onClose();
    const next = overrideTokenAt(view, pos, text.trim() || currentDisplay);
    if (next) {
      void audit.recordOverride(
        buildTokenAuditRecord(note.id, next, "override", CURRENT_USER.email),
      );
    }
    onClose();
  };

  const clear = () => {
    const pos = getPos();
    if (pos != null) clearOverrideAt(view, pos);
    onClose();
  };

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        data-token-interactive
        className="z-50 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
      >
        <div className="mb-1 text-xs font-semibold text-slate-600">Override value</div>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") onClose();
          }}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
        <div className="mt-1 text-[11px] text-amber-700">
          Overrides are flagged in the audit trail.
        </div>
        <div className="mt-2 flex items-center justify-between">
          {attrs.manuallyOverridden ? (
            <button
              onClick={clear}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Use live value
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800">
              Cancel
            </button>
            <button
              onClick={save}
              className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </FloatingPortal>
  );
}
