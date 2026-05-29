/**
 * Computes everything a token component needs to render: the effective value
 * (override > locked > live > draft), its semantic colors, staleness, flash,
 * and lock/override flags. Centralizes the display logic shared by the pill,
 * expandable, and linked renderers.
 */

import type { TokenAttrs } from "../types/tokens";
import { useLiveTokenValue } from "./useLiveTokenValue";
import { useChart } from "../store/ChartContext";
import { useUi } from "../store/UiContext";
import { tokenColors, type TokenColors } from "../tokens/tokenTheme";
import { isStale, relativeTime } from "../lib/staleness";
import { resolveDateToken } from "../lib/dates";
import { CURRENT_USER } from "../lib/user";
import type { TokenValue } from "../types/tokens";

export interface TokenDisplay {
  value: TokenValue | null;
  colors: TokenColors;
  stale: boolean;
  flash: boolean;
  locked: boolean;
  overridden: boolean;
  changedSinceOpen: boolean;
  relative: string;
  /** Order/status reported by the chart for this entity (e.g. discontinued). */
  status: TokenValue["status"];
}

export function useTokenDisplay(attrs: TokenAttrs): TokenDisplay {
  const { value: liveValue, flash, changedSinceOpen } = useLiveTokenValue(attrs, CURRENT_USER.email);
  const { getValue, chart } = useChart();
  const { settings, now } = useUi();

  const locked = attrs.lockState === "locked";
  const overridden = attrs.manuallyOverridden;

  // Date tokens roll with the clock while in draft, then freeze at signing.
  let value = liveValue;
  if (attrs.type === "date" && !locked && !overridden && liveValue?.dateKind) {
    value = {
      ...liveValue,
      display: resolveDateToken(liveValue.dateKind, now, chart?.patient.admitDate ?? now.toISOString()),
    };
  }

  // Staleness uses the live snapshot's acuity when available.
  const acuity = attrs.dataSourceId ? getValue(attrs.dataSourceId)?.acuity : undefined;
  const stale = !locked && isStale(attrs.type, value, acuity, now, settings.staleness);

  const colors = tokenColors(attrs.type, value, stale);
  const relative = relativeTime(value?.observedAt, now);

  return {
    value,
    colors,
    stale,
    flash,
    locked,
    overridden,
    changedSinceOpen,
    relative,
    status: value?.status,
  };
}
