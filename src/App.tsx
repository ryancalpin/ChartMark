/**
 * App shell. Composes the data/note/audit/ui/editor providers and the token
 * portal provider (mounted inside all contexts so portaled tokens inherit
 * them), then lays out the toolbar, patient banner, note canvas, and the
 * linked-token detail side panel.
 */

import { useMemo } from "react";
import { ChartProvider, useChart } from "./store/ChartContext";
import { NoteProvider, useNote } from "./store/NoteContext";
import { AuditProvider } from "./store/AuditContext";
import { UiProvider } from "./store/UiContext";
import { EditorProvider } from "./store/EditorContext";
import { PortalRegistry } from "./editor/nodeviews/portalRegistry";
import { TokenPortalProvider } from "./editor/nodeviews/TokenNodeViewContext";
import { ChartMarkEditor } from "./editor/ChartMarkEditor";
import { DetailSidePanel } from "./panels/DetailSidePanel";
import { Toolbar } from "./Toolbar";

function PatientBanner() {
  const { chart } = useChart();
  if (!chart) return null;
  const p = chart.patient;
  return (
    <div className="border-b border-slate-200 bg-white px-6 py-2.5">
      <div className="mx-auto flex max-w-3xl items-baseline gap-3">
        <span className="font-sans text-base font-semibold text-slate-900">{p.name}</span>
        <span className="text-sm text-slate-500">
          {p.age}{p.sex} · MRN {p.mrn}
        </span>
        <span className="ml-auto text-sm text-slate-600">{p.summary}</span>
      </div>
    </div>
  );
}

function NoteCanvas() {
  const { note } = useNote();
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50">
      <PatientBanner />
      <article className="mx-auto my-4 max-w-3xl rounded-lg border border-slate-200 bg-white px-4 py-6 shadow-sm sm:my-6 sm:px-10 sm:py-8">
        <h1 className="mb-4 font-display text-2xl text-slate-900 sm:text-3xl">{note.title}</h1>
        <ChartMarkEditor />
      </article>
    </main>
  );
}

export default function App() {
  const registry = useMemo(() => new PortalRegistry(), []);

  return (
    <ChartProvider>
      <NoteProvider>
        <AuditProvider>
          <UiProvider>
            <EditorProvider>
              <TokenPortalProvider registry={registry}>
                <div className="flex h-screen flex-col">
                  <Toolbar />
                  <div className="flex flex-1 overflow-hidden">
                    <NoteCanvas />
                    <DetailSidePanel />
                  </div>
                </div>
              </TokenPortalProvider>
            </EditorProvider>
          </UiProvider>
        </AuditProvider>
      </NoteProvider>
    </ChartProvider>
  );
}
