/**
 * Backend audit-trail records. Never shown to providers — this is the
 * medicolegal provenance log. Append-only by contract.
 */

import type { TokenType, TokenValue } from "./tokens";

export type AuditEvent = "created" | "live_change" | "override" | "signed";

export interface TokenAuditRecord {
  noteId: string;
  tokenId: string;
  type: TokenType;
  event: AuditEvent;
  dataSource: string | null;
  fhirResourceId: string | null;
  fhirResourceVersion: string | null;
  fetchedAt: string | null;
  valueAtFirstRender: TokenValue | null;
  valueAtSigning: TokenValue | null;
  changedBetweenDraftAndSigning: boolean;
  manuallyOverridden: boolean;
  actor: string;
  createdAt: string;
}

export interface AckRecord {
  noteId: string;
  tokenId: string;
  flagReason: string;
  acknowledged: boolean;
  actor: string;
  createdAt: string;
}

/** Write-only client used by the editor; never read back into the UI. */
export interface AuditService {
  recordTokenCreated(rec: TokenAuditRecord): Promise<void>;
  recordLiveChange(rec: TokenAuditRecord): Promise<void>;
  recordOverride(rec: TokenAuditRecord): Promise<void>;
  recordSigning(recs: TokenAuditRecord[]): Promise<void>;
  recordAck(rec: AckRecord): Promise<void>;
}
