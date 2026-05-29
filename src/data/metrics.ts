/**
 * Lightweight, non-PHI analytics store for the pitch dashboard. Records one
 * aggregate row per signed note in localStorage. Kept separate from the audit
 * trail (which is write-only and PHI-bearing); this holds only counts + timings
 * suitable for a time-motion / accuracy story.
 */

const KEY = "chartmark.metrics";

export interface SignMetric {
  noteId: string;
  noteType: string;
  openedAt: string;
  signedAt: string;
  msToSign: number;
  tokenCount: number;
  overriddenCount: number;
  changedCount: number;
  ackCount: number;
}

export function recordSign(m: SignMetric): void {
  const all = readMetrics();
  all.push(m);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function readMetrics(): SignMetric[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SignMetric[];
  } catch {
    return [];
  }
}

export function clearMetrics(): void {
  localStorage.removeItem(KEY);
}
