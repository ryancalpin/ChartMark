/**
 * ProseMirror schema. Standard rich-text nodes plus one custom inline-atom
 * `chart_token` node. Token state is stored entirely in node attrs so the
 * document is the single source of truth for provenance — undo/redo,
 * copy/paste, and JSON serialization all carry it.
 *
 * `leafText` is the load-bearing API for requirement 13: ProseMirror's
 * `textContent`/`textBetween` and the default clipboard text serializer call it
 * for leaf nodes, so any flatten-to-text path yields a clean value, no metadata.
 */

import { Schema, type NodeSpec } from "prosemirror-model";
import { addListNodes } from "prosemirror-schema-list";
import { schema as basicSchema } from "prosemirror-schema-basic";
import type { TokenAttrs } from "../types/tokens";
import { renderTokenPlainText } from "../tokens/plainText";

/** Default attrs for a freshly created (unresolved) token. */
function defaultTokenAttrs(): TokenAttrs {
  return {
    tokenId: "",
    type: "medication",
    dataSourceId: null,
    fhirResourceId: null,
    fhirResourceVersion: null,
    fetchedAt: null,
    draftValue: null,
    signedValue: null,
    lockState: "live",
    overrideValue: null,
    manuallyOverridden: false,
    displayLabel: "",
    aliasUsed: null,
  };
}

/** Serialize attrs into the data-attrs JSON used for in-editor copy round-trip. */
export function serializeAttrs(attrs: TokenAttrs): string {
  return JSON.stringify(attrs);
}

export function deserializeAttrs(json: string): TokenAttrs {
  return { ...defaultTokenAttrs(), ...(JSON.parse(json) as Partial<TokenAttrs>) };
}

const chartToken: NodeSpec = {
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  attrs: Object.fromEntries(
    Object.entries(defaultTokenAttrs()).map(([k, v]) => [k, { default: v }]),
  ),
  // Primary plain-text serializer: copy-out / print / textContent flatten here.
  leafText(node) {
    return renderTokenPlainText(node.attrs as TokenAttrs);
  },
  toDOM(node) {
    const attrs = node.attrs as TokenAttrs;
    return [
      "span",
      {
        "data-chart-token": "true",
        "data-token-id": attrs.tokenId,
        "data-type": attrs.type,
        "data-attrs": serializeAttrs(attrs),
        class: `cm-token cm-token-${attrs.type}`,
      },
      // Text child = the paste-into-plaintext fallback if data-attrs is dropped.
      renderTokenPlainText(attrs),
    ];
  },
  parseDOM: [
    {
      tag: "span[data-chart-token]",
      getAttrs(dom) {
        const el = dom as HTMLElement;
        try {
          return deserializeAttrs(el.dataset.attrs ?? "{}");
        } catch {
          return false; // fall back to treating the content as plain text
        }
      },
    },
  ],
};

// Base nodes: paragraphs, headings, lists, hard breaks, text. Add our token.
const nodes = addListNodes(basicSchema.spec.nodes, "paragraph block*", "block").addToEnd(
  "chart_token",
  chartToken,
);

export const schema = new Schema({
  nodes,
  marks: basicSchema.spec.marks,
});

export const chartTokenType = schema.nodes.chart_token;
