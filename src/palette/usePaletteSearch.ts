/**
 * Fuzzy-search over the pre-built palette index. The Fuse instance is created
 * once (heavy patients = 300+ items, so no per-keystroke API calls — req from
 * the design doc's performance section). Supports a category pre-filter that
 * Tab cycles through in the palette.
 */

import { useEffect, useMemo, useState } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";
import type { PaletteItem, PaletteCategory } from "../types/palette";
import { useChart } from "../store/ChartContext";
import { buildPaletteItems } from "./buildSearchIndex";

const FUSE_OPTIONS: IFuseOptions<PaletteItem> = {
  includeScore: true,
  threshold: 0.3,
  ignoreLocation: true,
  keys: [
    { name: "label", weight: 3 },
    { name: "aliases", weight: 2 },
    { name: "category", weight: 1 },
  ],
};

export function usePaletteSearch() {
  const { service } = useChart();
  const [items, setItems] = useState<PaletteItem[]>([]);

  useEffect(() => {
    let active = true;
    void buildPaletteItems(service).then((list) => {
      if (active) setItems(list);
    });
    return () => {
      active = false;
    };
  }, [service]);

  const fuse = useMemo(() => new Fuse(items, FUSE_OPTIONS), [items]);

  const search = useMemo(
    () =>
      (query: string, category: PaletteCategory): PaletteItem[] => {
        const inCategory = (i: PaletteItem) => category === "all" || i.category === category;
        if (!query.trim()) {
          return items.filter(inCategory).slice(0, 12);
        }
        return fuse
          .search(query)
          .map((r) => r.item)
          .filter(inCategory)
          .slice(0, 12);
      },
    [fuse, items],
  );

  return { search, ready: items.length > 0 };
}
