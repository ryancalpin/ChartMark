/**
 * Signing: walk the document, freeze each token's current value into
 * signedValue, flip lockState to "locked", and mark the doc signed (which the
 * lockState plugin uses to reject further content edits). Emits one audit
 * "signed" record per token capturing value-at-first-render vs value-at-signing.
 *
 * setNodeMarkup never changes node size, so collected positions stay valid
 * across the batch; the whole freeze is one transaction kept out of undo.
 */

import type { EditorView } from "prosemirror-view";
import type { TokenAttrs } from "../../types/tokens";
import type { ValueSnapshot } from "../../data/ChartDataService";
import type { AuditService } from "../../types/audit";
import { resolveCurrentValue } from "../../lib/resolveValue";
import { buildTokenAuditRecord } from "../../store/AuditContext";
import { lockStatePluginKey } from "../plugins/pluginKeys";

export interface SignContext {
  getValue: (dataSourceId: string) => ValueSnapshot | null;
  now: Date;
  admitDate: string;
  audit: AuditService;
  noteId: string;
  actor: string;
}

export function signNote(view: EditorView, ctx: SignContext): TokenAttrs[] {
  const { state } = view;
  const updates: { pos: number; attrs: TokenAttrs }[] = [];

  state.doc.descendants((node, pos) => {
    if (node.type.name !== "chart_token") return;
    const prev = node.attrs as TokenAttrs;
    const current =
      resolveCurrentValue(prev, {
        getValue: ctx.getValue,
        now: ctx.now,
        admitDate: ctx.admitDate,
      }) ?? prev.draftValue;
    updates.push({ pos, attrs: { ...prev, signedValue: current, lockState: "locked" } });
  });

  let tr = state.tr;
  for (const u of updates) tr = tr.setNodeMarkup(u.pos, undefined, u.attrs);
  tr.setMeta(lockStatePluginKey, { type: "lock" });
  tr.setMeta("addToHistory", false);
  view.dispatch(tr);

  const records = updates.map((u) =>
    buildTokenAuditRecord(ctx.noteId, u.attrs, "signed", ctx.actor),
  );
  void ctx.audit.recordSigning(records);

  return updates.map((u) => u.attrs);
}
