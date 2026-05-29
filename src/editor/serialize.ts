/**
 * Serialization for copy and print. Both flatten tokens to clean plain text
 * with their current/locked value and NO metadata (design-doc req 13).
 *
 * `clipboardTextSerializer` is installed on the EditorView so copying out of
 * ChartMark — into Epic's plain note box, an email, anywhere — yields readable
 * text rather than chip markup. In-editor copy still round-trips full token
 * state via the schema's toDOM/parseDOM.
 */

import type { Node as PMNode, Slice } from "prosemirror-model";
import type { TokenAttrs } from "../types/tokens";
import { renderTokenPlainText } from "../tokens/plainText";

function leafText(node: PMNode): string {
  if (node.type.name === "chart_token") return renderTokenPlainText(node.attrs as TokenAttrs);
  return "";
}

/** Flatten an entire document to plain text. */
export function docToText(doc: PMNode): string {
  return doc.textBetween(0, doc.content.size, "\n\n", leafText);
}

/** EditorView clipboardTextSerializer prop. */
export function clipboardTextSerializer(slice: Slice): string {
  return slice.content.textBetween(0, slice.content.size, "\n\n", leafText);
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Render the doc to clean print HTML — tokens collapse to plain text. */
export function docToPrintHTML(doc: PMNode, title: string): string {
  const blocks: string[] = [];

  doc.forEach((block) => {
    const text = esc(block.textBetween(0, block.content.size, "", leafText));
    if (block.type.name === "heading") {
      const level = (block.attrs.level as number) ?? 2;
      blocks.push(`<h${level}>${text}</h${level}>`);
    } else if (text.trim()) {
      blocks.push(`<p>${text}</p>`);
    } else {
      blocks.push("<p>&nbsp;</p>");
    }
  });

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; max-width: 7.5in; margin: 1in auto; color: #111; line-height: 1.5; }
  h1, h2, h3 { font-family: Georgia, serif; }
  p { margin: 0 0 0.6em; }
  .footer { margin-top: 2em; padding-top: 1em; border-top: 1px solid #ccc; font-size: 11px; color: #555; }
</style></head><body>
<h1>${esc(title)}</h1>
${blocks.join("\n")}
<div class="footer">Dynamic tokens reflect chart data at the time of signing.</div>
</body></html>`;
}
