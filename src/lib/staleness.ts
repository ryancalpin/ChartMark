/**
 * Staleness thresholds from the design doc. A token desaturates to grey once
 * its underlying datum is older than the threshold for its type/acuity.
 */

import type { TokenType, TokenValue } from "../types/tokens";

export interface StalenessSettings {
  acuteLabHours: number; // BMP, BNP, CBC, troponin
  routineLabHours: number; // lipids, HbA1c
  vitalHours: number;
}

export const DEFAULT_STALENESS: StalenessSettings = {
  acuteLabHours: 24,
  routineLabHours: 72,
  vitalHours: 4,
};

/** Hours after which a token of this type/acuity is considered stale, or null = never. */
export function stalenessThresholdHours(
  type: TokenType,
  acuity: "acute" | "routine" | undefined,
  settings: StalenessSettings,
): number | null {
  switch (type) {
    case "lab":
      return acuity === "routine" ? settings.routineLabHours : settings.acuteLabHours;
    case "vital":
      return settings.vitalHours;
    // Medications (binary order status), problems, imaging, dates: never stale by time.
    default:
      return null;
  }
}

export function hoursSince(iso: string | undefined, now: Date): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return (now.getTime() - then) / 3_600_000;
}

export function isStale(
  type: TokenType,
  value: TokenValue | null,
  acuity: "acute" | "routine" | undefined,
  now: Date,
  settings: StalenessSettings,
): boolean {
  const threshold = stalenessThresholdHours(type, acuity, settings);
  if (threshold === null) return false;
  const age = hoursSince(value?.observedAt, now);
  if (age === null) return false;
  return age > threshold;
}

/** Human "1h ago" / "2d ago" relative label for tooltips and vital pills. */
export function relativeTime(iso: string | undefined, now: Date): string {
  const h = hoursSince(iso, now);
  if (h === null) return "";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
