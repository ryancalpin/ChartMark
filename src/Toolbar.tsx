/**
 * Top toolbar + sign orchestration. "Sign" first evaluates the pre-sign
 * triggers: zero flags ⇒ sign silently; otherwise open the non-blocking review
 * drawer. Also hosts the abnormal-arrows toggle and Print/PDF export.
 */

import { useState } from "react";
import { useEditor } from "./store/EditorContext";
import { useNote } from "./store/NoteContext";
import { useUi } from "./store/UiContext";
import { useChart } from "./store/ChartContext";
import { useAudit } from "./store/AuditContext";
import { signNote } from "./editor/commands/signNote";
import { docToPrintHTML } from "./editor/serialize";
import { evaluateTriggers, type ReviewFlag } from "./lib/presign";
import { PreSignReviewDrawer } from "./panels/PreSignReviewDrawer";
import { CURRENT_USER } from "./lib/user";

export function Toolbar() {
  const { view } = useEditor();
  const { note, sign } = useNote();
  const { settings, setShowArrows, now } = useUi();
  const { getValue, chart } = useChart();
  const { service: audit } = useAudit();

  const [flags, setFlags] = useState<ReviewFlag[] | null>(null);
  const [acked, setAcked] = useState<Set<string>>(new Set());

  const admitDate = chart?.patient.admitDate ?? now.toISOString();
  const signed = note.status === "signed";

  const doSign = () => {
    if (!view) return;
    signNote(view, { getValue, now, admitDate, audit, noteId: note.id, actor: CURRENT_USER.email });
    sign(CURRENT_USER.name);
    setFlags(null);
  };

  const handleSignClick = () => {
    if (!view || signed) return;
    const found = evaluateTriggers(view.state.doc, {
      getValue,
      now,
      admitDate,
      staleness: settings.staleness,
    });
    if (found.length === 0) {
      doSign(); // silent sign
    } else {
      setFlags(found);
    }
  };

  const acknowledge = (flag: ReviewFlag) => {
    void audit.recordAck({
      noteId: note.id,
      tokenId: flag.tokenId,
      flagReason: flag.reason,
      acknowledged: true,
      actor: CURRENT_USER.email,
      createdAt: new Date().toISOString(),
    });
    setAcked((prev) => new Set(prev).add(flag.tokenId));
  };

  const print = () => {
    if (!view) return;
    const html = docToPrintHTML(view.state.doc, note.title);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl text-slate-900">ChartMark</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              signed ? "bg-slate-900 text-white" : "bg-amber-100 text-amber-800"
            }`}
          >
            {signed ? "Signed" : "Draft"}
          </span>
          {signed && note.signedBy && (
            <span className="text-xs text-slate-400">
              by {note.signedBy} · {new Date(note.signedAt ?? "").toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={settings.showAbnormalArrows}
              onChange={(e) => setShowArrows(e.target.checked)}
            />
            Abnormal arrows
          </label>
          <button
            onClick={print}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Print / PDF
          </button>
          <button
            onClick={handleSignClick}
            disabled={signed}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {signed ? "Signed ✓" : "Sign note"}
          </button>
        </div>
      </header>

      {flags && view && (
        <PreSignReviewDrawer
          view={view}
          flags={flags}
          acknowledged={acked}
          onAcknowledge={acknowledge}
          onSign={doSign}
          onCancel={() => setFlags(null)}
        />
      )}
    </>
  );
}
