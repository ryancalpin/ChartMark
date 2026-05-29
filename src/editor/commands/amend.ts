/**
 * Amendment workflow. Re-opening a signed note does NOT edit in place — it
 * appends a clearly-marked addendum (heading + editable paragraph) at the end
 * and switches the lock plugin into amend mode so only the new content is
 * editable. Required for CMS / Joint Commission compliance.
 */

import { TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { schema } from "../schema";
import { lockStatePluginKey } from "../plugins/pluginKeys";

/** Append an addendum scaffold and enter amend mode. Returns true on success. */
export function startAddendum(view: EditorView, author: string, reason: string): boolean {
  const { state } = view;
  const end = state.doc.content.size;

  const heading = schema.nodes.heading.create(
    { level: 3 },
    schema.text(`Addendum — ${new Date().toLocaleString()} — ${author}`),
  );
  const reasonPara = schema.nodes.paragraph.create(
    null,
    schema.text(`Reason: ${reason}`),
  );
  const body = schema.nodes.paragraph.create();

  let tr = state.tr.insert(end, [heading, reasonPara, body]);
  // Position the editable cursor inside the empty body paragraph.
  const bodyStart = end + heading.nodeSize + reasonPara.nodeSize + 1;
  tr = tr.setSelection(TextSelection.create(tr.doc, bodyStart));
  tr.setMeta(lockStatePluginKey, { type: "amend-init" });
  tr.setMeta("addToHistory", false);
  view.dispatch(tr);

  // Second transaction flips amend mode on, anchored at the body paragraph.
  const amendTr = view.state.tr.setMeta(lockStatePluginKey, { type: "amend-start", from: bodyStart });
  amendTr.setMeta("addToHistory", false);
  view.dispatch(amendTr);

  view.focus();
  return true;
}
