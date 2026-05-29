/** Reference-range line for the expanded lab view. */

import type { TokenValue } from "../../types/tokens";

export function ReferenceRange({ value }: { value: TokenValue }) {
  const r = value.referenceRange;
  if (!r) return null;
  const text =
    r.text ??
    (r.low !== undefined && r.high !== undefined
      ? `${r.low}–${r.high} ${r.unit ?? ""}`
      : r.high !== undefined
        ? `< ${r.high} ${r.unit ?? ""}`
        : r.low !== undefined
          ? `> ${r.low} ${r.unit ?? ""}`
          : "");
  if (!text) return null;
  return (
    <div className="text-xs text-slate-500">
      Reference: <span className="font-mono">{text.trim()}</span>
    </div>
  );
}
