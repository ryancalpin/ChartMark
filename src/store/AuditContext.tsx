/**
 * Thin provider exposing the write-only AuditService plus helpers to build
 * provenance records from token attrs. Never read back into the UI.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AckRecord, AuditEvent, AuditService, TokenAuditRecord } from "../types/audit";
import type { TokenAttrs } from "../types/tokens";
import { createAuditService } from "../data/auditServiceFactory";

interface AuditContextValue {
  service: AuditService;
  buildRecord: (
    noteId: string,
    attrs: TokenAttrs,
    event: AuditEvent,
    actor: string,
  ) => TokenAuditRecord;
}

const AuditContext = createContext<AuditContextValue | null>(null);

export function useAudit(): AuditContextValue {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used within AuditProvider");
  return ctx;
}

export function buildTokenAuditRecord(
  noteId: string,
  attrs: TokenAttrs,
  event: AuditEvent,
  actor: string,
): TokenAuditRecord {
  const changed =
    !!attrs.signedValue &&
    JSON.stringify(attrs.draftValue) !== JSON.stringify(attrs.signedValue);
  return {
    noteId,
    tokenId: attrs.tokenId,
    type: attrs.type,
    event,
    dataSource: attrs.dataSourceId,
    fhirResourceId: attrs.fhirResourceId,
    fhirResourceVersion: attrs.fhirResourceVersion,
    fetchedAt: attrs.fetchedAt,
    valueAtFirstRender: attrs.draftValue,
    valueAtSigning: attrs.signedValue,
    changedBetweenDraftAndSigning: changed,
    manuallyOverridden: attrs.manuallyOverridden,
    actor,
    createdAt: new Date().toISOString(),
  };
}

export type { AckRecord };

export function AuditProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => createAuditService(), []);
  const value = useMemo<AuditContextValue>(
    () => ({ service, buildRecord: buildTokenAuditRecord }),
    [service],
  );
  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}
