/**
 * Maps a token's type + value state to its design-doc colors and render mode.
 * Single source of truth for token appearance shared by React components.
 */

import type { TokenAttrs, TokenRenderMode, TokenType, TokenValue } from "../types/tokens";

export interface TokenColors {
  fg: string;
  bg: string;
}

const STALE: TokenColors = { fg: "#A09C94", bg: "#F2F0EB" };

const BASE: Record<TokenType, TokenColors> = {
  medication: { fg: "#1A5C9E", bg: "#EBF2FB" },
  lab: { fg: "#1A7A4A", bg: "#EAF5EF" }, // normal; overridden by abnormal below
  vital: { fg: "#6B35A8", bg: "#F3EDF9" },
  problem: { fg: "#9E5C1A", bg: "#FBF2EB" },
  imaging: { fg: "#2D5A8A", bg: "#EBF0F7" },
  allergy: { fg: "#9E1A1A", bg: "#FBEBEB" },
  consult: { fg: "#2D5A8A", bg: "#EBF0F7" },
  date: { fg: "#5A5550", bg: "#F0EFED" },
};

const LAB_HIGH: TokenColors = { fg: "#9E1A1A", bg: "#FBEBEB" };
const LAB_LOW: TokenColors = { fg: "#1A5C9E", bg: "#EBF2FB" };

export const RENDER_MODE: Record<TokenType, TokenRenderMode> = {
  medication: "pill",
  vital: "pill",
  allergy: "pill",
  date: "pill",
  problem: "linked",
  lab: "expandable",
  imaging: "expandable",
  // Consults are link references (hover summary + click-through to the detail
  // panel), not expandable lab-style values — LinkedToken and DetailSidePanel
  // both already handle them.
  consult: "linked",
};

/** Resolve final colors given type, value, and staleness. */
export function tokenColors(type: TokenType, value: TokenValue | null, stale: boolean): TokenColors {
  if (stale) return STALE;
  if (type === "lab" && value?.abnormal) {
    if (value.abnormal === "high" || value.abnormal === "critical-high") return LAB_HIGH;
    if (value.abnormal === "low" || value.abnormal === "critical-low") return LAB_LOW;
  }
  return BASE[type];
}

/** The leading glyph for each token type. */
export function tokenIcon(type: TokenType): string {
  switch (type) {
    case "medication":
      return "💊";
    case "lab":
      return "⬡";
    case "vital":
      return "❤";
    case "problem":
      return "◈";
    case "imaging":
      return "▣";
    case "allergy":
      return "⚠";
    case "consult":
      return "🔗";
    case "date":
      return "📅";
  }
}

/** The currently-effective value of a token, honoring override and lock state. */
export function effectiveValue(attrs: TokenAttrs, liveValue: TokenValue | null): TokenValue | null {
  if (attrs.manuallyOverridden && attrs.overrideValue) return attrs.overrideValue;
  if (attrs.lockState === "locked") return attrs.signedValue;
  return liveValue ?? attrs.draftValue;
}
