/**
 * The data-layer abstraction. The mock implementation reads the seeded
 * fixture; a future EpicChartDataService implements the same interface over
 * Epic FHIR R4 — so nothing above this line knows where chart data comes from.
 */

import type { Chart } from "../types/chart";
import type { PaletteItem } from "../types/palette";
import type { TokenType, TokenValue } from "../types/tokens";

/** A point-in-time read of one chart entity, with FHIR provenance. */
export interface ValueSnapshot {
  dataSourceId: string;
  type: TokenType;
  fhirResourceId: string;
  fhirResourceVersion: string;
  fetchedAt: string; // ISO of this fetch
  value: TokenValue;
  /** Acute vs routine drives lab staleness thresholds. */
  acuity?: "acute" | "routine";
}

export type Unsubscribe = () => void;

export interface ChartDataService {
  getChart(): Promise<Chart>;
  /** Flattened, pre-indexed searchable entities for the @ palette. */
  searchEntities(): Promise<PaletteItem[]>;
  /** Current value + FHIR meta for a single entity. */
  getValue(dataSourceId: string): ValueSnapshot | null;
  /** Subscribe to live updates for one entity (simulated push in mock). */
  subscribe(dataSourceId: string, cb: (v: ValueSnapshot) => void): Unsubscribe;
  /** Start the simulated live timeline (mock only; no-op for real Epic). */
  startLiveTimeline?(): void;
}
