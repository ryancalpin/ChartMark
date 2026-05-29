/**
 * Headless smoke test of ChartMark's load-bearing logic (no browser). Bundled
 * with esbuild and run under Node. Exercises the real schema, serialization,
 * sign/freeze, pre-sign triggers, search index, and value resolution.
 */

import assert from "node:assert";
import { schema, chartTokenType } from "../src/editor/schema";
import { docToText } from "../src/editor/serialize";
import { renderTokenPlainText } from "../src/tokens/plainText";
import { evaluateTriggers } from "../src/lib/presign";
import { resolveCurrentValue } from "../src/lib/resolveValue";
import { classifyAbnormal, abnormalArrow } from "../src/lib/abnormal";
import { isStale } from "../src/lib/staleness";
import { DEFAULT_STALENESS } from "../src/lib/staleness";
import { resolveDateToken } from "../src/lib/dates";
import { MockChartDataService } from "../src/data/MockChartDataService";
import type { TokenAttrs, TokenValue } from "../src/types/tokens";

let passed = 0;
const ok = (label: string) => {
  passed++;
  console.log(`  ✓ ${label}`);
};

// --- abnormal classification --------------------------------------------
assert.equal(classifyAbnormal(3.1, { low: 3.5, high: 5.1 }), "low");
assert.equal(classifyAbnormal(1850, { high: 100 }), "critical-high");
assert.equal(classifyAbnormal(4.0, { low: 3.5, high: 5.1 }), "normal");
assert.equal(abnormalArrow("low"), "↓");
assert.equal(abnormalArrow("critical-high"), "↑↑");
ok("abnormal classification + arrows");

// --- staleness -----------------------------------------------------------
const now = new Date();
const sixHoursAgo = new Date(now.getTime() - 6 * 3600_000).toISOString();
const oneHourAgo = new Date(now.getTime() - 3600_000).toISOString();
assert.equal(isStale("vital", { display: "x", observedAt: sixHoursAgo }, undefined, now, DEFAULT_STALENESS), true);
assert.equal(isStale("vital", { display: "x", observedAt: oneHourAgo }, undefined, now, DEFAULT_STALENESS), false);
assert.equal(isStale("lab", { display: "x", observedAt: sixHoursAgo }, "acute", now, DEFAULT_STALENESS), false);
assert.equal(isStale("medication", { display: "x", observedAt: sixHoursAgo }, undefined, now, DEFAULT_STALENESS), false);
ok("staleness thresholds (vital 4h / acute lab 24h / med never)");

// --- date tokens ---------------------------------------------------------
const today = resolveDateToken("today", new Date("2026-05-29"), "2026-05-26");
assert.ok(today.includes("May") && today.includes("2026"), today);
assert.equal(resolveDateToken("hospitalday", new Date("2026-05-29"), "2026-05-26"), "Hospital Day 4");
ok("date token resolution (rolling + hospital day)");

// --- token plain-text flattening ----------------------------------------
const labValue: TokenValue = {
  display: "Potassium 3.1 mEq/L",
  numeric: 3.1,
  abnormal: "low",
  observedAt: oneHourAgo,
};
const labAttrs: Partial<TokenAttrs> = {
  tokenId: "t1",
  type: "lab",
  dataSourceId: "lab-potassium",
  displayLabel: "Potassium",
  draftValue: labValue,
  lockState: "live",
};
assert.equal(renderTokenPlainText({ ...chartTokenType.create(labAttrs).attrs } as TokenAttrs), "Potassium 3.1 mEq/L ↓");
ok("token flattens to clean text with abnormal arrow, no metadata");

// --- document serialization (copy/print path) ----------------------------
const doc = schema.node("doc", null, [
  schema.node("heading", { level: 3 }, [schema.text("Objective")]),
  schema.node("paragraph", null, [
    schema.text("K is "),
    chartTokenType.create(labAttrs),
    schema.text(" today."),
  ]),
]);
const text = docToText(doc);
assert.ok(text.includes("K is Potassium 3.1 mEq/L ↓ today."), JSON.stringify(text));
assert.ok(!text.includes("data-attrs"), "serialized text must not leak metadata");
ok("docToText flattens tokens inline, drops metadata");

// --- sign freeze semantics (resolveCurrentValue) -------------------------
const getValue = (id: string) =>
  id === "lab-potassium"
    ? { value: { display: "Potassium 3.6 mEq/L", numeric: 3.6, abnormal: "normal" } as TokenValue }
    : null;
const current = resolveCurrentValue(chartTokenType.create(labAttrs).attrs as TokenAttrs, {
  getValue,
  now,
  admitDate: now.toISOString(),
});
assert.equal(current?.display, "Potassium 3.6 mEq/L");
ok("resolveCurrentValue reads live value for signing");

// --- pre-sign triggers ---------------------------------------------------
const flags = evaluateTriggers(doc, {
  getValue: (id) =>
    id === "lab-potassium"
      ? {
          dataSourceId: id,
          type: "lab",
          fhirResourceId: "x",
          fhirResourceVersion: "9",
          fetchedAt: now.toISOString(),
          value: { display: "Potassium 3.6 mEq/L", numeric: 3.6, abnormal: "normal" },
          acuity: "acute",
        }
      : null,
  now,
  admitDate: now.toISOString(),
  staleness: DEFAULT_STALENESS,
});
assert.equal(flags.length, 1, `expected 1 flag, got ${flags.length}`);
assert.equal(flags[0].reason, "value-changed");
ok("evaluateTriggers flags a changed value");

// --- mock data service ---------------------------------------------------
const svc = new MockChartDataService();
const items = await svc.searchEntities();
assert.ok(items.find((i) => i.aliases.includes("lasix"))?.label === "Furosemide", "lasix→Furosemide");
assert.ok(items.find((i) => i.expandsTo)?.aliases.includes("bmp"), "@bmp macro present");
assert.ok(items.some((i) => i.aliases.includes("k") && i.label === "Potassium"), "@k→Potassium");
const k = svc.getValue("lab-potassium");
assert.ok(k && k.value.abnormal === "low", "K is low in fixture");
const disc = svc.getValue("med-lisinopril");
assert.equal(disc?.value.status, "discontinued", "Lisinopril discontinued");
ok("mock service: aliases, macro, abnormal K, discontinued med");

// --- disambiguation variants ---------------------------------------------
const kItem = items.find((i) => i.dataSourceId === "lab-potassium");
assert.ok(kItem?.variants && kItem.variants.length >= 2, "potassium has multiple draws");
assert.ok(
  kItem!.variants![0].value.observedAt! >= kItem!.variants![1].value.observedAt!,
  "variants are newest-first",
);
assert.ok(kItem!.variants!.every((v) => typeof v.value.numeric === "number"), "variant values pinned");
const medItem = items.find((i) => i.type === "medication");
assert.ok(medItem && !medItem.variants, "medications have no draw variants");
ok("disambiguation: potassium draws newest-first with pinned values");

// --- smart templates -----------------------------------------------------
const { buildTemplateDoc } = await import("../src/templates/templates");
const { TEMPLATES } = await import("../src/templates/templates");
const hf = TEMPLATES.find((t) => t.id === "hf-admission")!;
const noopAudit = {
  recordTokenCreated: async () => {},
  recordLiveChange: async () => {},
  recordOverride: async () => {},
  recordSigning: async () => {},
  recordAck: async () => {},
};
const tdoc = buildTemplateDoc(hf, {
  getValue: (id: string) => svc.getValue(id),
  now,
  admitDate: now.toISOString(),
  audit: noopAudit,
  noteId: "note-x",
  actor: "tester",
});
let tokenNodes = 0;
let resolved = 0;
tdoc.descendants((n: { type: { name: string }; attrs: TokenAttrs }) => {
  if (n.type.name === "chart_token") {
    tokenNodes++;
    if (n.attrs.draftValue) resolved++;
  }
});
assert.ok(tokenNodes >= 10, `HF template wires many tokens, got ${tokenNodes}`);
assert.equal(tokenNodes, resolved, "every template slot resolved to a live value");
ok(`smart template wires ${tokenNodes} pre-resolved tokens`);

console.log(`\nAll smoke checks passed (${passed} groups).`);
