/**
 * Once a note is signed, the document becomes a permanent artifact: content
 * edits are rejected. The signing transaction itself (which freezes token
 * values) is allowed because the "signed" flag only flips as that transaction
 * applies. Amendments to a signed note are a separate addendum workflow.
 */

import { Plugin } from "prosemirror-state";
import { lockStatePluginKey } from "./pluginKeys";

export function createLockStatePlugin(): Plugin<boolean> {
  return new Plugin<boolean>({
    key: lockStatePluginKey,
    state: {
      init: () => false,
      apply: (tr, signed) => (tr.getMeta(lockStatePluginKey) === "signed" ? true : signed),
    },
    filterTransaction(tr, state) {
      const signed = lockStatePluginKey.getState(state);
      if (!signed) return true;
      // Block any content mutation after signing; allow selection + meta ops.
      if (tr.docChanged) return false;
      return true;
    },
  });
}
