/**
 * React wrapper that owns the ProseMirror EditorView lifecycle. It installs the
 * generic TokenNodeView (backed by the portal registry), the clipboard text
 * serializer, and a dispatch handler that mirrors the @-mention plugin state
 * into React so the floating CommandPalette can render and intercept keys.
 */

import { useEffect, useRef, useState } from "react";
import { EditorView } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import { buildInitialState } from "./editorState";
import { TokenNodeView } from "./nodeviews/TokenNodeView";
import { clipboardTextSerializer } from "./serialize";
import { mentionPluginKey } from "./plugins/pluginKeys";
import {
  INACTIVE_MENTION,
  type MentionState,
  type MentionKeyHandlerRef,
} from "./plugins/mentionTrigger";
import { usePortalRegistry } from "./nodeviews/TokenNodeViewContext";
import { useEditor } from "../store/EditorContext";
import { CommandPalette } from "../palette/CommandPalette";

export function ChartMarkEditor() {
  const mountRef = useRef<HTMLDivElement>(null);
  const registry = usePortalRegistry();
  const { setView, bump } = useEditor();

  // Stable handler ref the palette wires into for keyboard nav.
  const keyHandlerRef = useRef<MentionKeyHandlerRef>({ current: null }).current;
  const [mention, setMention] = useState<MentionState>(INACTIVE_MENTION);
  const [viewReady, setViewReady] = useState<EditorView | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const state = buildInitialState(keyHandlerRef);
    const view = new EditorView(mountRef.current, {
      state,
      clipboardTextSerializer,
      nodeViews: {
        chart_token: (node, nodeView, getPos) =>
          new TokenNodeView(node, nodeView, getPos as () => number | undefined, registry),
      },
      dispatchTransaction(tr) {
        const next = view.state.apply(tr);
        view.updateState(next);
        setMention(mentionPluginKey.getState(next) ?? INACTIVE_MENTION);
        bump();
      },
    });

    setView(view);
    setViewReady(view);

    return () => {
      view.destroy();
      setView(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <div ref={mountRef} className="cm-editor-mount" />
      {viewReady && (
        <CommandPalette view={viewReady} mention={mention} keyHandlerRef={keyHandlerRef} />
      )}
    </div>
  );
}
