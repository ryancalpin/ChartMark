/**
 * Watches for an active "@" mention and exposes it as plugin state so React can
 * render the floating command palette. We track a persistent query (the text
 * after "@") and the document position of "@" for replacement on insert.
 *
 * Keyboard nav while the palette is open is delegated to React via a mutable
 * handler ref: the plugin intercepts keydown only while active and asks the
 * palette whether it consumed the key (Arrow/Enter/Tab/Escape).
 */

import { Plugin } from "prosemirror-state";
import type { EditorState } from "prosemirror-state";
import { mentionPluginKey } from "./pluginKeys";

export interface MentionState {
  active: boolean;
  /** Document position of the "@" character. */
  from: number;
  query: string;
}

export const INACTIVE_MENTION: MentionState = { active: false, from: -1, query: "" };
const INACTIVE = INACTIVE_MENTION;

export interface MentionKeyHandlerRef {
  current: ((event: KeyboardEvent) => boolean) | null;
}

/** Derive mention state from the current selection + surrounding text. */
function readMention(state: EditorState): MentionState {
  const sel = state.selection;
  if (!sel.empty) return INACTIVE;

  const $from = sel.$from;
  // Text from the start of the current block to the cursor; atoms collapse to a
  // single placeholder char so offsets stay aligned with parentOffset.
  const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
  const at = textBefore.lastIndexOf("@");
  if (at === -1) return INACTIVE;

  // Only trigger at a word boundary (start of block or after whitespace) — this
  // avoids firing inside email addresses or mid-word.
  const charBefore = at === 0 ? "" : textBefore[at - 1];
  if (charBefore && !/\s/.test(charBefore)) return INACTIVE;

  const query = textBefore.slice(at + 1);
  if (/\s|￼/.test(query)) return INACTIVE; // closed by whitespace or a token

  const from = $from.start() + at;
  return { active: true, from, query };
}

export function createMentionPlugin(keyRef: MentionKeyHandlerRef): Plugin<MentionState> {
  return new Plugin<MentionState>({
    key: mentionPluginKey,
    state: {
      init: () => INACTIVE,
      apply: (_tr, _value, _old, newState) => readMention(newState),
    },
    props: {
      handleKeyDown(view, event) {
        const st = mentionPluginKey.getState(view.state);
        if (!st?.active) return false;
        return keyRef.current?.(event) ?? false;
      },
    },
  });
}
