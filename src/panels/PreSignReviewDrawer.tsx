/**
 * Non-blocking bottom drawer surfaced at sign time when (and only when) there
 * are flagged tokens. Lists each flag with an Acknowledge button; the provider
 * may sign regardless. Zero flags ⇒ this drawer never appears and the note
 * signs silently.
 */

import { NodeSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { ReviewFlag } from "../lib/presign";

const REASON_LABEL: Record<ReviewFlag["reason"], string> = {
  "value-changed": "Value changed",
  stale: "Stale data",
  discontinued: "Discontinued",
  unresolved: "Unresolved",
};

interface Props {
  view: EditorView;
  flags: ReviewFlag[];
  acknowledged: Set<string>;
  onAcknowledge: (flag: ReviewFlag) => void;
  onSign: () => void;
  onCancel: () => void;
}

export function PreSignReviewDrawer({
  view,
  flags,
  acknowledged,
  onAcknowledge,
  onSign,
  onCancel,
}: Props) {
  const selectToken = (pos: number) => {
    const sel = NodeSelection.create(view.state.doc, pos);
    view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
    view.focus();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
      <div className="mx-auto max-w-4xl px-6 py-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-sans text-sm font-semibold text-slate-800">
            Review before signing · {flags.length} item{flags.length === 1 ? "" : "s"}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="rounded px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              Keep editing
            </button>
            <button
              onClick={onSign}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Sign note
            </button>
          </div>
        </div>

        <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto">
          {flags.map((flag) => {
            const acked = acknowledged.has(flag.tokenId);
            return (
              <li key={flag.tokenId} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-24 shrink-0 text-[11px] font-medium uppercase tracking-wide text-amber-700">
                  {REASON_LABEL[flag.reason]}
                </span>
                <button
                  onClick={() => selectToken(flag.pos)}
                  className="font-medium text-slate-800 underline decoration-dotted hover:text-blue-700"
                >
                  {flag.label}
                </button>
                <span className="flex-1 truncate text-slate-500">{flag.message}</span>
                <button
                  onClick={() => onAcknowledge(flag)}
                  disabled={acked}
                  className={`shrink-0 rounded px-2 py-1 text-xs ${
                    acked
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {acked ? "✓ Acknowledged" : "Acknowledge"}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-2 text-[11px] text-slate-400">
          Dynamic tokens reflect chart data at the time of signing. Review your note before signing.
        </p>
      </div>
    </div>
  );
}
