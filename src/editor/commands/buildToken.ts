/**
 * Builds the attrs for a single resolved chart_token from a chart entity. Shared
 * by the @-palette insert path and the smart-template loader so both produce
 * identical, fully-provenanced tokens.
 */

import type { TokenAttrs, TokenType } from "../../types/tokens";
import type { ValueSnapshot } from "../../data/ChartDataService";
import { newId } from "../../lib/id";
import { resolveDateToken, type DateTokenKind } from "../../lib/dates";

export interface ResolveTokenParams {
  type: TokenType;
  dataSourceId: string | null;
  label: string;
  getValue: (dataSourceId: string) => ValueSnapshot | null;
  now: Date;
  admitDate: string;
  alias?: string | null;
  /** For date tokens. */
  dateKind?: DateTokenKind;
}

export function resolvedTokenAttrs(p: ResolveTokenParams): TokenAttrs {
  if (p.type === "date" && p.dateKind) {
    return {
      tokenId: newId(),
      type: "date",
      dataSourceId: null,
      fhirResourceId: null,
      fhirResourceVersion: null,
      fetchedAt: p.now.toISOString(),
      draftValue: { display: resolveDateToken(p.dateKind, p.now, p.admitDate), dateKind: p.dateKind },
      signedValue: null,
      lockState: "live",
      overrideValue: null,
      manuallyOverridden: false,
      displayLabel: p.label,
      aliasUsed: p.alias ?? null,
    };
  }

  const snap = p.dataSourceId ? p.getValue(p.dataSourceId) : null;
  return {
    tokenId: newId(),
    type: p.type,
    dataSourceId: p.dataSourceId,
    fhirResourceId: snap?.fhirResourceId ?? null,
    fhirResourceVersion: snap?.fhirResourceVersion ?? null,
    fetchedAt: snap?.fetchedAt ?? p.now.toISOString(),
    draftValue: snap?.value ?? null,
    signedValue: null,
    lockState: "live",
    overrideValue: null,
    manuallyOverridden: false,
    displayLabel: p.label,
    aliasUsed: p.alias ?? null,
  };
}
