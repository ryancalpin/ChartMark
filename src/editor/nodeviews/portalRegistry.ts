/**
 * Bridge between ProseMirror NodeViews and the React tree. Each token NodeView
 * registers a host <span> + its current attrs here; the TokenPortalProvider
 * subscribes and renders a React portal into every host. Because the provider
 * lives inside the app's context stack, portaled token components inherit
 * ChartContext / UiContext / settings like any other React node.
 */

import type { EditorView } from "prosemirror-view";
import type { TokenAttrs } from "../../types/tokens";

export interface PortalEntry {
  id: string;
  host: HTMLElement;
  attrs: TokenAttrs;
  view: EditorView;
  getPos: () => number | undefined;
}

type Listener = (entries: PortalEntry[]) => void;

export class PortalRegistry {
  private entries = new Map<string, PortalEntry>();
  private listeners = new Set<Listener>();

  mount(entry: PortalEntry): void {
    this.entries.set(entry.id, entry);
    this.notify();
  }

  update(id: string, attrs: TokenAttrs): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    entry.attrs = attrs;
    this.notify();
  }

  unmount(id: string): void {
    if (this.entries.delete(id)) this.notify();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => this.listeners.delete(fn);
  }

  snapshot(): PortalEntry[] {
    return [...this.entries.values()];
  }

  private notify(): void {
    const snap = this.snapshot();
    this.listeners.forEach((l) => l(snap));
  }
}
