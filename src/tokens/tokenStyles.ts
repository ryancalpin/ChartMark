/** Shared chip styling helpers for token components. */

import type { CSSProperties } from "react";
import type { TokenColors } from "./tokenTheme";

export function chipStyle(colors: TokenColors): CSSProperties {
  return { color: colors.fg, backgroundColor: colors.bg, borderColor: colors.fg + "33" };
}

export function chipClass(opts: {
  locked: boolean;
  flash: boolean;
  stale: boolean;
  allergy?: boolean;
}): string {
  const base =
    "cm-chip inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.92em] leading-none align-baseline cursor-default select-none transition-colors";
  const parts = [base];
  if (!opts.locked) parts.push("animate-token-pulse");
  if (opts.flash) parts.push("animate-token-flash");
  if (opts.allergy) parts.push("font-semibold");
  return parts.join(" ");
}
