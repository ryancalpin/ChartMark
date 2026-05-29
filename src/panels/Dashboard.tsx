/**
 * Pitch metrics dashboard. Aggregates the per-signed-note analytics store into
 * the numbers a time-motion / accuracy story needs: time-to-sign, token
 * override rate (a proxy for documentation errors averted), and changed-at-sign
 * rate. Sign a few notes to populate it.
 */

import { useMemo, type ReactNode } from "react";
import { clearMetrics, readMetrics, type SignMetric } from "../data/metrics";

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmtDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}m ${r}s`;
}

export function Dashboard({ onClose }: { onClose: () => void }) {
  const metrics = useMemo<SignMetric[]>(() => readMetrics(), []);

  const agg = useMemo(() => {
    const n = metrics.length;
    const tokens = metrics.reduce((s, m) => s + m.tokenCount, 0);
    const overridden = metrics.reduce((s, m) => s + m.overriddenCount, 0);
    const changed = metrics.reduce((s, m) => s + m.changedCount, 0);
    const times = metrics.map((m) => m.msToSign);
    const byType = new Map<string, number[]>();
    metrics.forEach((m) => {
      const arr = byType.get(m.noteType) ?? [];
      arr.push(m.msToSign);
      byType.set(m.noteType, arr);
    });
    return {
      n,
      tokens,
      overrideRate: tokens ? (overridden / tokens) * 100 : 0,
      changedRate: tokens ? (changed / tokens) * 100 : 0,
      avgTime: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      medianTime: median(times),
      byType: [...byType.entries()].map(([type, arr]) => ({
        type,
        count: arr.length,
        avg: arr.reduce((a, b) => a + b, 0) / arr.length,
      })),
    };
  }, [metrics]);

  return (
    <Overlay title="Pitch Metrics" onClose={onClose}>
      {metrics.length === 0 ? (
        <p className="text-sm text-slate-500">
          No signed notes yet. Sign a note (with some tokens) to populate the dashboard.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Notes signed" value={String(agg.n)} />
            <Stat label="Median time-to-sign" value={fmtDuration(agg.medianTime)} />
            <Stat label="Avg time-to-sign" value={fmtDuration(agg.avgTime)} />
            <Stat label="Tokens used" value={String(agg.tokens)} />
            <Stat label="Override rate" value={`${agg.overrideRate.toFixed(1)}%`} hint="errors averted" />
            <Stat label="Changed-at-sign" value={`${agg.changedRate.toFixed(1)}%`} hint="caught live" />
          </div>

          <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-700">Time-to-sign by note type</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-1">Note type</th>
                <th className="py-1">Count</th>
                <th className="py-1">Avg</th>
              </tr>
            </thead>
            <tbody>
              {agg.byType.map((r) => (
                <tr key={r.type} className="border-t border-slate-100">
                  <td className="py-1.5">{r.type}</td>
                  <td className="py-1.5">{r.count}</td>
                  <td className="py-1.5">{fmtDuration(r.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={() => {
              clearMetrics();
              onClose();
            }}
            className="mt-6 text-xs text-slate-400 hover:text-slate-700"
          >
            Clear metrics
          </button>
        </>
      )}
    </Overlay>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      {hint && <div className="text-[10px] uppercase tracking-wide text-slate-400">{hint}</div>}
    </div>
  );
}

export function Overlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
