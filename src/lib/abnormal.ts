/** Abnormal-value classification and the inline directional arrows. */

import type { AbnormalLevel } from "../types/tokens";

/** Classify a numeric value against a reference range. */
export function classifyAbnormal(
  value: number,
  range: { low?: number; high?: number } | undefined,
): AbnormalLevel {
  if (!range) return "normal";
  const { low, high } = range;
  if (high !== undefined && value > high) {
    // >1.5x over the top of range reads as critically high.
    return value > high * 1.5 ? "critical-high" : "high";
  }
  if (low !== undefined && value < low) {
    return value < low * 0.5 ? "critical-low" : "low";
  }
  return "normal";
}

/** The arrow glyph for an abnormal level, or "" for normal. */
export function abnormalArrow(level: AbnormalLevel | undefined): string {
  switch (level) {
    case "high":
      return "↑";
    case "critical-high":
      return "↑↑";
    case "low":
      return "↓";
    case "critical-low":
      return "↓↓";
    default:
      return "";
  }
}

export function isAbnormal(level: AbnormalLevel | undefined): boolean {
  return !!level && level !== "normal";
}
