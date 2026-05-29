/**
 * Top toolbar + lifecycle orchestration: templates, signing (with the pre-sign
 * review trigger gate), the co-signature workflow, post-sign addenda, the
 * pitch-metrics dashboard, and the admin audit viewer. Also the abnormal-arrows
 * toggle and Print/PDF export. Lays out responsively for tablet demos.
 */

import { useState } from "react";
import { useEditor } from "./store/EditorContext";
import { useNote } from "./store/NoteContext";
import { useUi } from "./store/UiContext";
import { useChart } from "./store/ChartContext";
import { useAudit } from "./store/AuditContext";
import { signNote } from "./editor/commands/signNote";
import { startAddendum } from "./editor/commands/amend";
import { applyTemplate, TEMPLATES } from "./templates/templates";
import { docToPrintHTML } from "./editor/serialize";
import { lockStatePluginKey } from "./editor/plugins/pluginKeys";
import { evaluateTriggers, type ReviewFlag } from "./lib/presign";
import { PreSignReviewDrawer } from "./panels/PreSignReviewDrawer";
import { Dashboard } from "./panels/Dashboard";
import { AuditViewer } from "./panels/AuditViewer";
import { recordSign } from "./data/metrics";
import { CURRENT_USER } from "./lib/user";
import type { TokenAttrs } from "./types/tokens";

const ATTENDING = "Dr. A. Attending, MD";

export function Toolbar() {
  const { view } = useEditor();
  const { note, sign, submitForCosign, addAddendum, setTitle } = useNote();
  const { settings, setShowArrows, now } = useUi();
  const { getValue, chart } = useChart();
  const { service: audit } = useAudit();

  const [flags, setFlags] = useState<ReviewFlag[] | null>(null);
  const [acked, setAcked] = useState<Set<string>>(new Set());
  const [pendingSigner, setPendingSigner] = useState<string | null>(null);
  const [requireCosign, setRequireCosign] = useState(false);
  const [overlay, setOverlay] = useState<null | "dashboard" | "audit">(null);

  const admitDate = chart?.patient.admitDate ?? now.toISOString();
  const status = note.status;
  const signed = status === "signed";

  const ctx = () => ({
    getValue,
    now,
    admitDate,
    audit,
    noteId: note.id,
    actor: CURRENT_USER.email,
  });

  /** Freeze every token, lock the note, record metrics, finalize status. */
  const freezeAndSign = (signedBy: string) => {
    if (!view) return;
    const tokens: TokenAttrs[] = signNote(view, ctx());
    const overriddenCount = tokens.filter((t) => t.manuallyOverridden).length;
    const changedCount = tokens.filter(
      (t) => JSON.stringify(t.draftValue) !== JSON.stringify(t.signedValue),
    ).length;
    recordSign({
      noteId: note.id,
      noteType: note.type,
      openedAt: note.openedAt,
      signedAt: new Date().toISOString(),
      msToSign: Date.now() - new Date(note.openedAt).getTime(),
      tokenCount: tokens.length,
      overriddenCount,
      changedCount,
      ackCount: acked.size,
    });
    sign(signedBy);
    setFlags(null);
    setPendingSigner(null);
  };

  /** Gate the finalizing signature behind the pre-sign review triggers. */
  const requestFinalize = (signedBy: string) => {
    if (!view) return;
    const found = evaluateTriggers(view.state.doc, {
      getValue,
      now,
      admitDate,
      staleness: settings.staleness,
    });
    if (found.length === 0) {
      freezeAndSign(signedBy); // silent sign
    } else {
      setPendingSigner(signedBy);
      setFlags(found);
    }
  };

  const handlePrimary = () => {
    if (!view) return;
    if (status === "draft" && requireCosign) {
      // Preliminary signature: lock content but keep tokens live for the attending.
      view.dispatch(view.state.tr.setMeta(lockStatePluginKey, { type: "lock" }));
      submitForCosign(CURRENT_USER.name);
      return;
    }
    if (status === "draft") return requestFinalize(CURRENT_USER.name);
    if (status === "pending_cosign") return requestFinalize(ATTENDING);
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

  const chooseTemplate = (id: string) => {
    if (!view || status !== "draft") return;
    const template = TEMPLATES.find((t) => t.id === id);
    if (!template) return;
    applyTemplate(view, template, ctx());
    setTitle(template.name, template.noteType);
  };

  const addendum = () => {
    if (!view) return;
    const reason = window.prompt("Reason for addendum:", "Late result review");
    if (reason === null) return;
    startAddendum(view, CURRENT_USER.name, reason || "—");
    addAddendum(CURRENT_USER.name, reason || "—");
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

  const primaryLabel =
    status === "signed"
      ? "Signed ✓"
      : status === "pending_cosign"
        ? "Co-sign & finalize"
        : requireCosign
          ? "Submit for co-sign"
          : "Sign note";

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-xl text-slate-900">ChartMark</span>
          <StatusBadge status={status} />
          {note.submittedBy && status === "pending_cosign" && (
            <span className="text-xs text-slate-400">submitted by {note.submittedBy}</span>
          )}
          {signed && note.signedBy && (
            <span className="hidden text-xs text-slate-400 sm:inline">
              by {note.signedBy} · {new Date(note.signedAt ?? "").toLocaleString()}
            </span>
          )}
          {note.addenda.length > 0 && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
              {note.addenda.length} addend{note.addenda.length === 1 ? "um" : "a"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status === "draft" && (
            <select
              defaultValue=""
              onChange={(e) => {
                chooseTemplate(e.target.value);
                e.currentTarget.value = "";
              }}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
              title="Load a smart template"
            >
              <option value="" disabled>
                Template…
              </option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={settings.showAbnormalArrows}
              onChange={(e) => setShowArrows(e.target.checked)}
            />
            Arrows
          </label>

          {status === "draft" && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={requireCosign}
                onChange={(e) => setRequireCosign(e.target.checked)}
              />
              Co-sign
            </label>
          )}

          <button onClick={() => setOverlay("dashboard")} className="hidden rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 sm:block">
            Metrics
          </button>
          <button onClick={() => setOverlay("audit")} className="hidden rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 sm:block">
            Audit
          </button>
          <button onClick={print} className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
            Print
          </button>

          {signed ? (
            <button
              onClick={addendum}
              className="rounded bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              Add addendum
            </button>
          ) : (
            <button
              onClick={handlePrimary}
              className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </header>

      {flags && view && (
        <PreSignReviewDrawer
          view={view}
          flags={flags}
          acknowledged={acked}
          onAcknowledge={acknowledge}
          onSign={() => freezeAndSign(pendingSigner ?? CURRENT_USER.name)}
          onCancel={() => {
            setFlags(null);
            setPendingSigner(null);
          }}
        />
      )}

      {overlay === "dashboard" && <Dashboard onClose={() => setOverlay(null)} />}
      {overlay === "audit" && <AuditViewer noteId={note.id} onClose={() => setOverlay(null)} />}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-amber-100 text-amber-800" },
    pending_cosign: { label: "Pending co-sign", cls: "bg-sky-100 text-sky-800" },
    signed: { label: "Signed", cls: "bg-slate-900 text-white" },
  };
  const s = map[status] ?? map.draft;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
