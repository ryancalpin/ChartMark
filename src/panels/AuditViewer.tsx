/**
 * Admin / medicolegal audit viewer. Explicitly NOT a provider surface — it
 * reveals the backend provenance trail (data source, FHIR resource id +
 * version, fetch time, value-changed + override flags) for after-the-fact
 * review. Reads the mock log by default, or the FastAPI service when enabled.
 */

import { useEffect, useState } from "react";
import { readAuditTrail, type AuditTrail } from "../data/auditRead";
import { Overlay } from "./Dashboard";

const EVENT_LABEL: Record<string, string> = {
  created: "Created",
  live_change: "Live change",
  override: "Override",
  signed: "Signed",
};

export function AuditViewer({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const [trail, setTrail] = useState<AuditTrail | null>(null);

  useEffect(() => {
    let active = true;
    void readAuditTrail(noteId).then((t) => active && setTrail(t));
    return () => {
      active = false;
    };
  }, [noteId]);

  return (
    <Overlay title="Admin · Medicolegal Audit Trail" onClose={onClose}>
      <p className="mb-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Internal compliance view — never shown to providers. Records exactly what the system
        displayed and when.
      </p>

      {!trail ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : trail.tokens.length === 0 ? (
        <p className="text-sm text-slate-500">No audit records for this note yet.</p>
      ) : (
        <>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left uppercase tracking-wide text-slate-400">
                <th className="py-1">Event</th>
                <th className="py-1">Type</th>
                <th className="py-1">FHIR resource</th>
                <th className="py-1">Ver</th>
                <th className="py-1">Flags</th>
                <th className="py-1">When</th>
              </tr>
            </thead>
            <tbody>
              {trail.tokens.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 align-top">
                  <td className="py-1.5 font-medium">{EVENT_LABEL[r.event] ?? r.event}</td>
                  <td className="py-1.5">{r.type}</td>
                  <td className="py-1.5 font-mono text-[11px] text-slate-500">{r.fhirResourceId ?? "—"}</td>
                  <td className="py-1.5 font-mono">{r.fhirResourceVersion ?? "—"}</td>
                  <td className="py-1.5">
                    {r.changed && <span className="mr-1 rounded bg-blue-50 px-1 text-blue-700">changed</span>}
                    {r.overridden && <span className="rounded bg-amber-50 px-1 text-amber-700">override</span>}
                  </td>
                  <td className="py-1.5 text-slate-400">{new Date(r.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {trail.acks.length > 0 && (
            <>
              <h3 className="mt-5 mb-1 text-sm font-semibold text-slate-700">Pre-sign acknowledgements</h3>
              <ul className="text-xs text-slate-600">
                {trail.acks.map((a, i) => (
                  <li key={i} className="border-t border-slate-100 py-1.5">
                    <span className="font-medium">{a.flagReason}</span> · {a.actor} ·{" "}
                    {new Date(a.createdAt).toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Overlay>
  );
}
