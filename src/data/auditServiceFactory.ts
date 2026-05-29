import type { AuditService } from "../types/audit";
import { MockAuditService } from "./MockAuditService";
import { HttpAuditService } from "./HttpAuditService";

/** Use the real FastAPI service only when explicitly enabled; mock otherwise. */
export function createAuditService(): AuditService {
  const useReal = import.meta.env.VITE_USE_REAL_AUDIT === "true";
  return useReal ? new HttpAuditService() : new MockAuditService();
}
