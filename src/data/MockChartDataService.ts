/**
 * Mock chart data service backed by the seeded John Doe fixture. Builds the
 * searchable palette index (entities + aliases + panel macros + date tokens),
 * resolves point-in-time values, and runs a scripted "live timeline" that
 * mutates a couple of values after note open to demo the flash-on-change and
 * pre-sign "value changed" trigger.
 */

import type { Chart } from "../types/chart";
import type { PaletteItem } from "../types/palette";
import type { TokenType, TokenValue } from "../types/tokens";
import { ENTITY_ALIASES, PANEL_MACROS } from "../fixtures/aliases";
import { johnDoeChart } from "../fixtures/patient-john-doe";
import {
  allergyToValue,
  consultToValue,
  imagingToValue,
  labToValue,
  medToValue,
  problemToValue,
  vitalToValue,
} from "../lib/fhir";
import { abnormalArrow, classifyAbnormal } from "../lib/abnormal";
import type { ChartDataService, Unsubscribe, ValueSnapshot } from "./ChartDataService";

interface EntityRecord {
  dataSourceId: string;
  type: TokenType;
  label: string;
  category: PaletteItem["category"];
  fhirResourceId: string;
  fhirResourceVersion: string;
  value: TokenValue;
  acuity?: "acute" | "routine";
}

export class MockChartDataService implements ChartDataService {
  private chart: Chart;
  private entities = new Map<string, EntityRecord>();
  private subscribers = new Map<string, Set<(v: ValueSnapshot) => void>>();
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(chart: Chart = johnDoeChart) {
    this.chart = chart;
    this.indexEntities();
  }

  async getChart(): Promise<Chart> {
    return this.chart;
  }

  getValue(dataSourceId: string): ValueSnapshot | null {
    const e = this.entities.get(dataSourceId);
    if (!e) return null;
    return {
      dataSourceId: e.dataSourceId,
      type: e.type,
      fhirResourceId: e.fhirResourceId,
      fhirResourceVersion: e.fhirResourceVersion,
      fetchedAt: new Date().toISOString(),
      value: e.value,
      acuity: e.acuity,
    };
  }

  subscribe(dataSourceId: string, cb: (v: ValueSnapshot) => void): Unsubscribe {
    let set = this.subscribers.get(dataSourceId);
    if (!set) {
      set = new Set();
      this.subscribers.set(dataSourceId, set);
    }
    set.add(cb);
    return () => set?.delete(cb);
  }

  async searchEntities(): Promise<PaletteItem[]> {
    const items: PaletteItem[] = [];

    for (const e of this.entities.values()) {
      items.push({
        id: e.dataSourceId,
        type: e.type,
        category: e.category,
        label: e.label,
        aliases: ENTITY_ALIASES[e.dataSourceId] ?? [],
        recentValue: this.previewValue(e.value),
        recentAt: e.value.observedAt,
        dataSourceId: e.dataSourceId,
        fhirResourceId: e.fhirResourceId,
        fhirResourceVersion: e.fhirResourceVersion,
      });
    }

    // Panel macros (e.g. @bmp) — expand to the members present in the chart.
    for (const [alias, macro] of Object.entries(PANEL_MACROS)) {
      const present = macro.members.filter((m) => this.entities.has(m));
      if (present.length === 0) continue;
      items.push({
        id: `macro-${alias}`,
        type: "lab",
        category: "lab",
        label: macro.label,
        aliases: [alias],
        recentValue: `${present.length} components`,
        dataSourceId: `macro-${alias}`,
        fhirResourceId: "macro",
        fhirResourceVersion: "0",
        expandsTo: present,
      });
    }

    return items;
  }

  /** Kick off the scripted updates. Called once after the editor mounts. */
  startLiveTimeline(): void {
    // 12s in: potassium repleted, redrawn 3.1 → 3.6 (now normal). Demos flash +
    // the "value changed since note opened" pre-sign trigger.
    this.timers.push(
      setTimeout(() => {
        this.updateLab("lab-potassium", 3.6);
      }, 12_000),
    );

    // 20s in: a second furosemide dose pushes the order version (no display
    // change) — exercises the metadata-refresh path without a flash.
    this.timers.push(
      setTimeout(() => {
        const med = this.entities.get("med-furosemide");
        if (med) {
          med.fhirResourceVersion = String(Number(med.fhirResourceVersion) + 1);
          this.emit("med-furosemide");
        }
      }, 20_000),
    );
  }

  dispose(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  // --- internals -----------------------------------------------------------

  private updateLab(dataSourceId: string, newValue: number): void {
    const e = this.entities.get(dataSourceId);
    if (!e) return;
    const range = e.value.referenceRange;
    const abnormal = classifyAbnormal(newValue, range);
    e.value = {
      ...e.value,
      display: `${e.label} ${newValue} ${e.value.unit ?? ""}`.trim(),
      numeric: newValue,
      abnormal,
      observedAt: new Date().toISOString(),
      trend: [...(e.value.trend ?? []), { t: new Date().toISOString(), v: newValue }],
    };
    e.fhirResourceVersion = String(Number(e.fhirResourceVersion) + 1);
    this.emit(dataSourceId);
  }

  private emit(dataSourceId: string): void {
    const snap = this.getValue(dataSourceId);
    if (!snap) return;
    this.subscribers.get(dataSourceId)?.forEach((cb) => cb(snap));
  }

  private previewValue(v: TokenValue): string {
    const arrow = abnormalArrow(v.abnormal);
    return arrow ? `${v.display} ${arrow}` : v.display;
  }

  private indexEntities(): void {
    const add = (e: EntityRecord) => this.entities.set(e.dataSourceId, e);

    for (const m of this.chart.medications) {
      add({
        dataSourceId: m.id,
        type: "medication",
        label: m.name,
        category: "medication",
        fhirResourceId: m.fhirResourceId,
        fhirResourceVersion: m.fhirResourceVersion,
        value: medToValue(m),
      });
    }
    for (const l of this.chart.labs) {
      add({
        dataSourceId: l.id,
        type: "lab",
        label: l.name,
        category: "lab",
        fhirResourceId: l.fhirResourceId,
        fhirResourceVersion: l.fhirResourceVersion,
        value: labToValue(l),
        acuity: l.acuity,
      });
    }
    for (const v of this.chart.vitals) {
      add({
        dataSourceId: v.id,
        type: "vital",
        label: v.type,
        category: "vital",
        fhirResourceId: v.fhirResourceId,
        fhirResourceVersion: v.fhirResourceVersion,
        value: vitalToValue(v),
      });
    }
    for (const p of this.chart.problems) {
      add({
        dataSourceId: p.id,
        type: "problem",
        label: p.name,
        category: "problem",
        fhirResourceId: p.fhirResourceId,
        fhirResourceVersion: p.fhirResourceVersion,
        value: problemToValue(p),
      });
    }
    for (const i of this.chart.imaging) {
      add({
        dataSourceId: i.id,
        type: "imaging",
        label: i.modality,
        category: "imaging",
        fhirResourceId: i.fhirResourceId,
        fhirResourceVersion: i.fhirResourceVersion,
        value: imagingToValue(i),
      });
    }
    for (const a of this.chart.allergies) {
      add({
        dataSourceId: a.id,
        type: "allergy",
        label: a.allergen,
        category: "allergy",
        fhirResourceId: a.fhirResourceId,
        fhirResourceVersion: a.fhirResourceVersion,
        value: allergyToValue(a),
      });
    }
    for (const c of this.chart.consults) {
      add({
        dataSourceId: c.id,
        type: "consult",
        label: `${c.service} Consult`,
        category: "consult",
        fhirResourceId: c.fhirResourceId,
        fhirResourceVersion: c.fhirResourceVersion,
        value: consultToValue(c),
      });
    }
  }
}
