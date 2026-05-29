/**
 * Document lock + amendment guard for signed notes.
 *
 * Lifecycle:
 *   - "lock" meta  → content becomes read-only (used at preliminary co-sign
 *     submission AND at final signing). The token-freeze transaction emitted by
 *     signNote also carries this meta, and is explicitly allowed through.
 *   - "amend-init" meta → the single transaction that appends an addendum
 *     scaffold to the end of a locked note (allowed).
 *   - "amend-start" meta {from} → enters amend mode; thereafter only edits at or
 *     after `from` are allowed, so the original signed content stays immutable.
 *
 * In-place editing of signed content is rejected — amendments are append-only,
 * matching CMS / Joint Commission requirements.
 */

import { Plugin } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";
import { lockStatePluginKey } from "./pluginKeys";

export interface LockState {
  locked: boolean;
  amending: boolean;
  amendFrom: number;
}

interface LockMeta {
  type: "lock" | "amend-init" | "amend-start";
  from?: number;
}

const INITIAL: LockState = { locked: false, amending: false, amendFrom: 0 };

/** True only if every change in the transaction begins at/after `floor`. */
function allChangesAfter(tr: Transaction, floor: number): boolean {
  return tr.steps.every((step) => {
    const from = (step as unknown as { from?: number }).from;
    return from === undefined || from >= floor;
  });
}

export function createLockStatePlugin(): Plugin<LockState> {
  return new Plugin<LockState>({
    key: lockStatePluginKey,
    state: {
      init: () => INITIAL,
      apply(tr, prev) {
        let next = prev;
        const meta = tr.getMeta(lockStatePluginKey) as LockMeta | undefined;
        if (meta?.type === "lock") next = { ...next, locked: true };
        if (meta?.type === "amend-start") {
          next = { ...next, amending: true, amendFrom: meta.from ?? next.amendFrom };
        }
        // Keep the amend boundary correct across subsequent edits.
        if (next.amending) next = { ...next, amendFrom: tr.mapping.map(next.amendFrom) };
        return next;
      },
    },
    filterTransaction(tr, state) {
      const st = lockStatePluginKey.getState(state);
      if (!st || !st.locked) return true;
      if (!tr.docChanged) return true;

      const meta = tr.getMeta(lockStatePluginKey) as LockMeta | undefined;
      if (meta?.type === "lock") return true; // the token-freeze transaction
      if (meta?.type === "amend-init") return true; // appends the addendum scaffold

      if (st.amending) return allChangesAfter(tr, st.amendFrom);
      return false; // signed content is otherwise immutable
    },
  });
}
