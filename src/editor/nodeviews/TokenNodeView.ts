/**
 * One generic NodeView for every token type. It owns a host <span> that
 * ProseMirror places in the document, registers it with the PortalRegistry,
 * and otherwise stays out of React's way:
 *   - update() re-renders the SAME portal in place when tokenId is unchanged
 *     (preserving expand/hover React state); a changed tokenId rebuilds.
 *   - ignoreMutation() => true: React owns the subtree, PM must not read it back.
 *   - stopEvent() lets chip-internal clicks (expand, open detail, override)
 *     through to React while leaving caret clicks to ProseMirror.
 */

import type { Node as PMNode } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";
import type { TokenAttrs } from "../../types/tokens";
import type { PortalRegistry } from "./portalRegistry";

export class TokenNodeView implements NodeView {
  dom: HTMLElement;
  private tokenId: string;

  constructor(
    node: PMNode,
    private view: EditorView,
    private getPos: () => number | undefined,
    private registry: PortalRegistry,
  ) {
    const attrs = node.attrs as TokenAttrs;
    this.tokenId = attrs.tokenId;

    this.dom = document.createElement("span");
    this.dom.className = "cm-token-host";
    this.dom.setAttribute("data-token-id", attrs.tokenId);

    this.registry.mount({
      id: attrs.tokenId,
      host: this.dom,
      attrs,
      view: this.view,
      getPos: this.getPos,
    });
  }

  update(node: PMNode): boolean {
    if (node.type.name !== "chart_token") return false;
    const attrs = node.attrs as TokenAttrs;
    if (attrs.tokenId !== this.tokenId) return false; // identity changed → rebuild
    this.registry.update(this.tokenId, attrs);
    return true;
  }

  selectNode(): void {
    this.dom.classList.add("cm-token-selected");
  }

  deselectNode(): void {
    this.dom.classList.remove("cm-token-selected");
  }

  // Chip-internal interactions are flagged by React via this data attribute so
  // ProseMirror lets them through; plain clicks fall through to PM selection.
  stopEvent(event: Event): boolean {
    const target = event.target as HTMLElement | null;
    return !!target?.closest("[data-token-interactive]");
  }

  ignoreMutation(): boolean {
    return true;
  }

  destroy(): void {
    this.registry.unmount(this.tokenId);
  }
}
