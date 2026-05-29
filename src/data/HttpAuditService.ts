/**
 * HTTP client for the FastAPI + SQLite audit service. Same interface as the
 * mock; selected when VITE_USE_REAL_AUDIT=true. Failures are swallowed with a
 * console error — ChartMark must never block documentation on the audit sink.
 */

import type { AckRecord, AuditService, TokenAuditRecord } from "../types/audit";

export class HttpAuditService implements AuditService {
  constructor(private baseUrl = "/api/audit") {}

  private async post(path: string, body: unknown): Promise<void> {
    try {
      await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("audit post failed (non-blocking)", path, err);
    }
  }

  async recordTokenCreated(rec: TokenAuditRecord): Promise<void> {
    await this.post("/tokens", rec);
  }
  async recordLiveChange(rec: TokenAuditRecord): Promise<void> {
    await this.post("/tokens", rec);
  }
  async recordOverride(rec: TokenAuditRecord): Promise<void> {
    await this.post("/tokens", rec);
  }
  async recordSigning(recs: TokenAuditRecord[]): Promise<void> {
    await this.post("/signing", { records: recs });
  }
  async recordAck(rec: AckRecord): Promise<void> {
    await this.post("/acks", rec);
  }
}
