/**
 * Manual token override (design-doc req 12). The provider types a value; we
 * flag it on the node and the audit trail. ChartMark never blocks documentation
 * — the override is always allowed, just recorded.
 */

import type { EditorView } from "prosemirror-view";
import type { TokenAttrs, TokenValue } from "../../types/tokens";

export function overrideTokenAt(
  view: EditorView,
  pos: number,
  displayText: string,
): TokenAttrs | null {
  const node = view.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "chart_token") return null;

  const prev = node.attrs as TokenAttrs;
  const overrideValue: TokenValue = {
    ...(prev.overrideValue ?? prev.draftValue ?? { display: displayText }),
    display: displayText,
  };
  const next: TokenAttrs = { ...prev, manuallyOverridden: true, overrideValue };

  const tr = view.state.tr.setNodeMarkup(pos, undefined, next);
  view.dispatch(tr);
  return next;
}

/** Clear a manual override, returning the token to live/locked behavior. */
export function clearOverrideAt(view: EditorView, pos: number): void {
  const node = view.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "chart_token") return;
  const prev = node.attrs as TokenAttrs;
  const next: TokenAttrs = { ...prev, manuallyOverridden: false, overrideValue: null };
  view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, next));
}
