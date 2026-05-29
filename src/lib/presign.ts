/**
 * Pure evaluation of the pre-sign review triggers. Walks the document's tokens
 * and returns only those worth the provider's attention. Zero flags ⇒ the note
 * signs silently (design-doc philosophy: earn attention by asking rarely).
 */

import type { Node as PMNode } from "prosemirror-model";
import type { TokenAttrs } from "../types/tokens";
import type { ValueSnapshot } from "../data/ChartDataService";
import type { StalenessSettings } from "./staleness";
import { isStale } from "./staleness";
import { resolveCurrentValue } from "./resolveValue";
import { renderTokenPlainText } from "../tokens/plainText";

export type FlagReason =
  | "value-changed"
  | "stale"
  | "discontinued"
  | "unresolved";

export interface ReviewFlag {
  tokenId: string;
  pos: number;
  label: string;
  reason: FlagReason;
  message: string;
  draftDisplay: string;
  currentDisplay: string;
}

export interface EvaluateContext {
  getValue: (dataSourceId: string) => ValueSnapshot | null;
  now: Date;
  admitDate: string;
  staleness: StalenessSettings;
}

export function evaluateTriggers(doc: PMNode, ctx: EvaluateContext): ReviewFlag[] {
  const flags: ReviewFlag[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name !== "chart_token") return;
    const attrs = node.attrs as TokenAttrs;
    if (attrs.manuallyOverridden) return; // override is an explicit provider choice

    const snapshot = attrs.dataSourceId ? ctx.getValue(attrs.dataSourceId) : null;
    const current = resolveCurrentValue(attrs, ctx);
    const draftDisplay = attrs.draftValue ? renderTokenPlainText({ ...attrs, signedValue: null, lockState: "live" }) : "—";
    const currentDisplay = current?.display ?? "[unavailable]";

    const push = (reason: FlagReason, message: string) =>
      flags.push({ tokenId: attrs.tokenId, pos, label: attrs.displayLabel, reason, message, draftDisplay, currentDisplay });

    // Unresolved: token points at data we can no longer read.
    if (attrs.dataSourceId && !snapshot) {
      push("unresolved", "Data is no longer available.");
      return;
    }
    if (!attrs.draftValue && !current) {
      push("unresolved", "Token never resolved a value.");
      return;
    }

    // Discontinued medication order.
    if (attrs.type === "medication" && current?.status === "discontinued") {
      push("discontinued", "This medication order was discontinued.");
      return;
    }

    // Value changed since the note was opened.
    if (
      attrs.draftValue &&
      current &&
      JSON.stringify(attrs.draftValue) !== JSON.stringify(current)
    ) {
      push("value-changed", `Changed from "${draftDisplay}" to "${currentDisplay}".`);
      return;
    }

    // Stale data past the threshold for its type.
    if (isStale(attrs.type, current, snapshot?.acuity, ctx.now, ctx.staleness)) {
      push("stale", "Data is older than the staleness threshold.");
    }
  });

  return flags;
}
