/**
 * In-browser audit sink. Appends provenance records to localStorage so the
 * trail is inspectable in a demo without standing up the FastAPI service.
 * Append-only by contract — there is no read path in the app UI.
 */

import type { AckRecord, AuditService, TokenAuditRecord } from "../types/audit";

const KEY = "chartmark.audit";

interface AuditLog {
  tokens: TokenAuditRecord[];
  acks: AckRecord[];
}

function load(): AuditLog {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "") as AuditLog;
  } catch {
    return { tokens: [], acks: [] };
  }
}

function save(log: AuditLog): void {
  localStorage.setItem(KEY, JSON.stringify(log));
}

export class MockAuditService implements AuditService {
  private append(rec: TokenAuditRecord): void {
    const log = load();
    log.tokens.push(rec);
    save(log);
  }

  async recordTokenCreated(rec: TokenAuditRecord): Promise<void> {
    this.append(rec);
  }
  async recordLiveChange(rec: TokenAuditRecord): Promise<void> {
    this.append(rec);
  }
  async recordOverride(rec: TokenAuditRecord): Promise<void> {
    this.append(rec);
  }
  async recordSigning(recs: TokenAuditRecord[]): Promise<void> {
    const log = load();
    log.tokens.push(...recs);
    save(log);
  }
  async recordAck(rec: AckRecord): Promise<void> {
    const log = load();
    log.acks.push(rec);
    save(log);
  }
}
