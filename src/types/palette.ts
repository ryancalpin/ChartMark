/** Search palette item shapes. */

import type { TokenType } from "./tokens";

export type PaletteCategory =
  | "all"
  | "medication"
  | "lab"
  | "vital"
  | "problem"
  | "imaging"
  | "allergy"
  | "consult"
  | "date";

/**
 * A flattened, searchable chart entity. Built once at note open and fed to
 * Fuse.js. A `bmp`-style macro expands into several tokens on selection.
 */
export interface PaletteItem {
  id: string;
  type: TokenType;
  category: Exclude<PaletteCategory, "all">;
  /** Canonical name shown in the row and inserted as the token label. */
  label: string;
  /** Clinical aliases that should match this item (lasix, k, cr, ...). */
  aliases: string[];
  /** Pre-rendered current value preview, e.g. "3.1 mEq/L ↓". */
  recentValue?: string;
  recentAt?: string;
  dataSourceId: string;
  fhirResourceId: string;
  fhirResourceVersion: string;
  /**
   * Macro expansion: if present, selecting this item inserts a token for each
   * of these dataSourceIds instead of for `dataSourceId`. e.g. @bmp.
   */
  expandsTo?: string[];
}
