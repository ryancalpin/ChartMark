/**
 * Future production implementation: Epic FHIR R4 over the Hyperspace/App
 * Orchard sanctioned path. Stubbed for v1 (no Epic sandbox). It will reuse the
 * mappers in lib/fhir.ts after normalizing Epic's FHIR quirks (non-standard
 * status codes, extensions, pagination) into our domain Chart shapes, and back
 * `subscribe` with FHIR R4 Subscriptions + a polling fallback.
 */

import type { Chart } from "../types/chart";
import type { PaletteItem } from "../types/palette";
import type { ChartDataService, Unsubscribe, ValueSnapshot } from "./ChartDataService";

const NOT_IMPLEMENTED = "EpicChartDataService is not implemented in v1 — requires Epic FHIR sandbox.";

export class EpicChartDataService implements ChartDataService {
  async getChart(): Promise<Chart> {
    throw new Error(NOT_IMPLEMENTED);
  }
  async searchEntities(): Promise<PaletteItem[]> {
    throw new Error(NOT_IMPLEMENTED);
  }
  getValue(): ValueSnapshot | null {
    throw new Error(NOT_IMPLEMENTED);
  }
  subscribe(): Unsubscribe {
    throw new Error(NOT_IMPLEMENTED);
  }
}
