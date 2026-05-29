/**
 * Builds and inserts chart_token node(s) from a chosen palette item, replacing
 * the "@query" range in one transaction. Panel macros (e.g. @bmp) expand into
 * one token per member. Date items resolve their initial display from "now".
 * Emits a "created" audit record per inserted token.
 */

import type { Node as PMNode } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import type { PaletteItem } from "../../types/palette";
import type { TokenAttrs, TokenValue } from "../../types/tokens";
import type { ValueSnapshot } from "../../data/ChartDataService";
import type { AuditService } from "../../types/audit";
import { schema, chartTokenType } from "../schema";
import { newId } from "../../lib/id";
import { resolveDateToken, type DateTokenKind } from "../../lib/dates";
import { buildTokenAuditRecord } from "../../store/AuditContext";

export interface InsertContext {
  getValue: (dataSourceId: string) => ValueSnapshot | null;
  now: Date;
  admitDate: string;
  audit: AuditService;
  noteId: string;
  actor: string;
}

function dateValue(item: PaletteItem, ctx: InsertContext): TokenValue {
  const kind = item.dataSourceId.replace("date-", "") as DateTokenKind;
  return { display: resolveDateToken(kind, ctx.now, ctx.admitDate), dateKind: kind };
}

/** Build the attrs for one token from a (non-macro) palette item. */
function attrsForItem(item: PaletteItem, ctx: InsertContext, alias: string | null): TokenAttrs {
  const isDate = item.type === "date";
  const snapshot = isDate ? null : ctx.getValue(item.dataSourceId);
  const draftValue = isDate ? dateValue(item, ctx) : (snapshot?.value ?? null);

  return {
    tokenId: newId(),
    type: item.type,
    dataSourceId: isDate ? null : item.dataSourceId,
    fhirResourceId: snapshot?.fhirResourceId ?? null,
    fhirResourceVersion: snapshot?.fhirResourceVersion ?? null,
    fetchedAt: snapshot?.fetchedAt ?? ctx.now.toISOString(),
    draftValue,
    signedValue: null,
    lockState: "live",
    overrideValue: null,
    manuallyOverridden: false,
    displayLabel: item.label,
    aliasUsed: alias,
  };
}

/** Build attrs for a token pinned to a specific historical value (no live link). */
function attrsForPinned(
  item: PaletteItem,
  value: TokenValue,
  ctx: InsertContext,
  alias: string | null,
): TokenAttrs {
  return {
    tokenId: newId(),
    type: item.type,
    dataSourceId: null, // pinned to a point-in-time result → does not update live
    fhirResourceId: item.fhirResourceId,
    fhirResourceVersion: item.fhirResourceVersion,
    fetchedAt: value.observedAt ?? ctx.now.toISOString(),
    draftValue: value,
    signedValue: null,
    lockState: "live",
    overrideValue: null,
    manuallyOverridden: false,
    displayLabel: item.label,
    aliasUsed: alias,
  };
}

export function insertTokens(
  view: EditorView,
  from: number,
  to: number,
  item: PaletteItem,
  ctx: InsertContext,
  alias: string | null,
  pinnedValue: TokenValue | null = null,
): void {
  if (pinnedValue) {
    insertAttrs(view, from, to, [attrsForPinned(item, pinnedValue, ctx, alias)], ctx);
    return;
  }

  // Resolve the list of token attrs (expand macros).
  const attrsList: TokenAttrs[] = item.expandsTo
    ? item.expandsTo.map((id) =>
        attrsForItem(
          {
            ...item,
            id,
            dataSourceId: id,
            expandsTo: undefined,
            label: ctx.getValue(id)?.value.display.split(" ")[0] ?? id,
            type: "lab",
            category: "lab",
          },
          ctx,
          alias,
        ),
      )
    : [attrsForItem(item, ctx, alias)];

  insertAttrs(view, from, to, attrsList, ctx);
}

/** Replace [from,to] with the given token nodes (joined for readability) + audit. */
function insertAttrs(
  view: EditorView,
  from: number,
  to: number,
  attrsList: TokenAttrs[],
  ctx: InsertContext,
): void {
  const content: PMNode[] = [];
  attrsList.forEach((attrs, i) => {
    content.push(chartTokenType.create(attrs));
    // Separate multi-token macro inserts with ", "; always end with a space.
    content.push(schema.text(i < attrsList.length - 1 ? ", " : " "));
  });

  view.dispatch(view.state.tr.replaceWith(from, to, content));
  view.focus();

  attrsList.forEach((attrs) => {
    void ctx.audit.recordTokenCreated(
      buildTokenAuditRecord(ctx.noteId, attrs, "created", ctx.actor),
    );
  });
}
