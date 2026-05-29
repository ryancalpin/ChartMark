/**
 * Smart note templates. Unlike Epic dot phrases (which drop static text you
 * fill manually), a ChartMark template drops in live-wired token slots that
 * auto-populate from the chart on load. Each slot references a chart entity by
 * dataSourceId; the loader resolves it to a fully-provenanced token.
 */

import type { Node as PMNode } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import type { TokenType } from "../types/tokens";
import { schema, chartTokenType } from "../editor/schema";
import { resolvedTokenAttrs } from "../editor/commands/buildToken";
import { buildTokenAuditRecord } from "../store/AuditContext";
import type { InsertContext } from "../editor/commands/insertToken";

type Part =
  | { t: "text"; text: string }
  | { t: "token"; dataSourceId: string; type: TokenType; label: string };

type Block = { h: string } | { p: Part[] };

export interface NoteTemplate {
  id: string;
  name: string;
  noteType: string;
  blocks: Block[];
}

const tx = (text: string): Part => ({ t: "text", text });
const tok = (dataSourceId: string, type: TokenType, label: string): Part => ({
  t: "token",
  dataSourceId,
  type,
  label,
});

export const TEMPLATES: NoteTemplate[] = [
  {
    id: "progress",
    name: "Progress Note",
    noteType: "Progress Note",
    blocks: [
      { h: "Subjective" },
      { p: [tx("Type @ to pull live chart data.")] },
      { h: "Objective" },
      { p: [] },
      { h: "Assessment & Plan" },
      { p: [] },
    ],
  },
  {
    id: "hf-admission",
    name: "HF Admission Note",
    noteType: "H&P — Heart Failure Admission",
    blocks: [
      { h: "HPI" },
      {
        p: [
          tx("67 y/o male admitted with acute decompensated heart failure. Home regimen includes "),
          tok("med-furosemide", "medication", "Furosemide"),
          tx(", "),
          tok("med-carvedilol", "medication", "Carvedilol"),
          tx(", and "),
          tok("med-apixaban", "medication", "Apixaban"),
          tx("."),
        ],
      },
      { h: "Objective" },
      {
        p: [
          tx("Vitals: "),
          tok("vital-bp", "vital", "BP"),
          tx(", "),
          tok("vital-hr", "vital", "HR"),
          tx(", "),
          tok("vital-spo2", "vital", "SpO2"),
          tx(". Weight "),
          tok("vital-weight", "vital", "Weight"),
          tx("."),
        ],
      },
      {
        p: [
          tx("Labs notable for "),
          tok("lab-bnp", "lab", "BNP"),
          tx(", "),
          tok("lab-creatinine", "lab", "Creatinine"),
          tx(", "),
          tok("lab-potassium", "lab", "Potassium"),
          tx("."),
        ],
      },
      {
        p: [tx("Imaging: "), tok("img-cxr", "imaging", "Chest X-ray"), tx(".")],
      },
      { h: "Assessment & Plan" },
      {
        p: [
          tok("prob-hfref", "problem", "HFrEF, EF 30%"),
          tx(" — "),
        ],
      },
      {
        p: [tok("prob-ckd", "problem", "CKD Stage IV"), tx(" — ")],
      },
      {
        p: [tok("prob-afib", "problem", "Atrial Fibrillation"), tx(" — ")],
      },
    ],
  },
  {
    id: "cards-consult",
    name: "Cardiology Consult",
    noteType: "Cardiology Consult Note",
    blocks: [
      { h: "Reason for Consult" },
      { p: [] },
      { h: "Assessment" },
      {
        p: [
          tx("Patient with "),
          tok("prob-hfref", "problem", "HFrEF, EF 30%"),
          tx(". Most recent "),
          tok("lab-bnp", "lab", "BNP"),
          tx(" with "),
          tok("img-echo", "imaging", "Echocardiogram"),
          tx("."),
        ],
      },
      { h: "Recommendations" },
      { p: [] },
    ],
  },
];

/** Build a ProseMirror document from a template, resolving every token slot. */
export function buildTemplateDoc(template: NoteTemplate, ctx: InsertContext): PMNode {
  const created: ReturnType<typeof resolvedTokenAttrs>[] = [];

  const blocks = template.blocks.map((block) => {
    if ("h" in block) {
      return schema.nodes.heading.create({ level: 3 }, schema.text(block.h));
    }
    const inline: PMNode[] = block.p.map((part) => {
      if (part.t === "text") return schema.text(part.text);
      const attrs = resolvedTokenAttrs({
        type: part.type,
        dataSourceId: part.dataSourceId,
        label: part.label,
        getValue: ctx.getValue,
        now: ctx.now,
        admitDate: ctx.admitDate,
      });
      created.push(attrs);
      return chartTokenType.create(attrs);
    });
    return schema.nodes.paragraph.create(null, inline.length ? inline : undefined);
  });

  // Audit every pre-wired token as "created" (non-blocking).
  created.forEach((attrs) =>
    void ctx.audit.recordTokenCreated(buildTokenAuditRecord(ctx.noteId, attrs, "created", ctx.actor)),
  );

  return schema.nodes.doc.create(null, blocks);
}

/** Replace the editor's entire document with a freshly resolved template. */
export function applyTemplate(view: EditorView, template: NoteTemplate, ctx: InsertContext): void {
  const doc = buildTemplateDoc(template, ctx);
  const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content);
  view.dispatch(tr);
  view.focus();
}
