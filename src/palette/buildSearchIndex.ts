/**
 * Builds the flat list of searchable palette items: every chart entity (with
 * aliases + macros) from the data service, plus the rolling date tokens. This
 * list is indexed once per note open and handed to Fuse.js.
 */

import type { ChartDataService } from "../data/ChartDataService";
import type { PaletteItem } from "../types/palette";
import { DATE_TOKENS } from "../lib/dates";

function dateItems(): PaletteItem[] {
  return DATE_TOKENS.map((d) => ({
    id: `date-${d.kind}`,
    type: "date" as const,
    category: "date" as const,
    label: d.label,
    aliases: [d.alias, "date"],
    recentValue: d.label,
    dataSourceId: `date-${d.kind}`,
    fhirResourceId: "date",
    fhirResourceVersion: "0",
  }));
}

export async function buildPaletteItems(service: ChartDataService): Promise<PaletteItem[]> {
  const entities = await service.searchEntities();
  return [...entities, ...dateItems()];
}
