/**
 * Assembles the initial EditorState: a seeded progress-note skeleton plus the
 * plugin stack (history, keymaps, the @ mention trigger, and the signed-lock
 * guard). The mention plugin needs a mutable key-handler ref the palette wires
 * into so it can intercept Arrow/Enter/Tab/Escape while open.
 */

import { EditorState } from "prosemirror-state";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { schema } from "./schema";
import { createMentionPlugin, type MentionKeyHandlerRef } from "./plugins/mentionTrigger";
import { createLockStatePlugin } from "./plugins/lockState";

/** Section-header skeleton for a progress note. */
function buildInitialDoc() {
  const h = (text: string) => schema.nodes.heading.create({ level: 3 }, schema.text(text));
  const p = (text?: string) =>
    text ? schema.nodes.paragraph.create(null, schema.text(text)) : schema.nodes.paragraph.create();

  return schema.nodes.doc.create(null, [
    h("Subjective"),
    p("67 y/o male admitted for acute decompensated heart failure. Type @ to pull live chart data."),
    h("Objective"),
    p(),
    h("Assessment & Plan"),
    p(),
  ]);
}

export function buildInitialState(keyRef: MentionKeyHandlerRef): EditorState {
  return EditorState.create({
    schema,
    doc: buildInitialDoc(),
    plugins: [
      history(),
      // The mention plugin must precede the keymaps: while the @ palette is
      // open it intercepts Enter/Tab/Arrow/Escape via handleKeyDown, and
      // ProseMirror queries plugins in array order. If baseKeymap came first it
      // would claim Enter (split block) before the palette could insert a token.
      // When the palette is closed the plugin returns false and keys fall
      // through to the keymaps as normal.
      createMentionPlugin(keyRef),
      keymap({ "Mod-z": undo, "Mod-y": redo, "Mod-Shift-z": redo }),
      keymap(baseKeymap),
      createLockStatePlugin(),
    ],
  });
}
