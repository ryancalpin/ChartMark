/**
 * Right-hand detail panel opened by linked tokens (problems, consults). Shows
 * the full problem or consult record so the reader never has to leave the note
 * to understand a referenced concept.
 */

import { useUi } from "../store/UiContext";
import { useChart } from "../store/ChartContext";

export function DetailSidePanel() {
  const { detail, closeDetail } = useUi();
  const { chart } = useChart();
  if (!detail || !chart) return null;

  const problem = chart.problems.find((p) => p.id === detail.dataSourceId);
  const consult = chart.consults.find((c) => c.id === detail.dataSourceId);

  return (
    <aside className="fixed inset-y-0 right-0 z-30 flex h-full w-80 shrink-0 flex-col border-l border-slate-200 bg-white shadow-2xl lg:static lg:z-auto lg:shadow-none">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="font-display text-lg text-slate-800">Detail</h2>
        <button onClick={closeDetail} className="text-slate-400 hover:text-slate-700" aria-label="close">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {problem && (
          <div className="space-y-2">
            <div className="font-sans text-base font-semibold text-slate-800">{problem.name}</div>
            <Field label="ICD-10" value={problem.icdCode} />
            <Field label="Onset" value={problem.onset} />
            <Field label="Status" value={problem.status} />
            <p className="pt-2 leading-relaxed text-slate-700">{problem.detail}</p>
          </div>
        )}

        {consult && (
          <div className="space-y-2">
            <div className="font-sans text-base font-semibold text-slate-800">
              {consult.service} Consult
            </div>
            <Field label="Date" value={new Date(consult.date).toLocaleDateString()} />
            <div className="rounded-md bg-slate-50 p-2 text-slate-700">{consult.summary}</div>
            <p className="pt-1 leading-relaxed text-slate-700">{consult.detail}</p>
          </div>
        )}

        {!problem && !consult && <div className="text-slate-400">No detail available.</div>}
      </div>
    </aside>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-16 shrink-0 uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}
